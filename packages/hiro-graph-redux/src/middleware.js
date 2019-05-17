import {
    updateVertices,
    setMe,
    taskLoading,
    taskSuccess,
    taskError,
    GRAPH_ACTION,
    GRAPH_LOGIN_FUNCTION,
    GRAPH_LOGIN_TRIGGER,
    GRAPH_LOGOUT,
    GRAPH_CANCEL,
    GRAPH_UPDATE,
    LOGOUT_HOOK,
    TOKEN_INVALIDATION_HOOK,
    TASK_UPDATE
} from "./actions";
import { getMyId, $inflateVertex } from "./reducer";
import ReduxToken from "./token";
import { cancelablePromise } from "./utils";
import { isUnknown } from "@hiro-graph/client/lib/errors";
import Context from "@hiro-graph/orm";
import GraphVertex, { mergeRelations } from "@hiro-graph/orm/lib/vertex/graph";
import isPlainObject from "lodash.isplainobject";

const removeFromArray = (item, array) => {
    const idx = array.indexOf(item);
    if (idx !== -1) {
        array.splice(idx, 1);
    }
};

// this looks massively complex, but our middleware function
// creates a redux middleware that is aware of our orm and provide helpers
// to the action handlers inside.
//
//  This is the magic behind this module.
//
// a redux middleware is a function that takes dispatch and returns a function
// of action that returns a function of next.
// simples....
//
// but we need access to subscribe.
// So this needs to be a store enhancer...
const createStoreEnhancer = (...ctxArgs) => createStore => (
    reducer,
    initialState,
    enhancer
) => {
    const store = createStore(reducer, initialState, enhancer);
    return {
        ...store,
        dispatch: middleware(ctxArgs, store)
    };
};

function middleware(ctxArgs, { dispatch: next, getState, subscribe }) {
    //now do our own middlewaring...
    const orm = ctxArgs.length === 1 ? ctxArgs[0] : new Context(...ctxArgs);
    //we use duck typing as instanceof can be weird.
    //check for a few well known properties
    if (
        ["me", "gremlin", "setCache", "getConnection"].some(
            f => typeof orm[f] !== "function"
        )
    ) {
        throw new Error(
            "could not create middleware, arguments not valid HiroGraphOrm or HiroGraphOrm constructor arguments"
        );
    }
    let loginTrigger;
    const fireLoginFunction = () => {
        if (typeof loginTrigger === "function") {
            loginTrigger();
        } else {
            throw new Error(
                "Attempt to login, with setting a login trigger - did you configure the implicit oauth correctly?"
            );
        }
    };

    //now the middleware that performs the side-effects
    const dispatch = action => {
        switch (action.type) {
            case GRAPH_ACTION:
                const { key, handler, args } = action;
                //this allows a function as a key. so your keys can be created by the arguments you pass.
                //e.g. JSON.stringify could be used so identical args produce identical keys
                const taskKey = typeof key === "function" ? key(...args) : key;

                //should we check and see if this task is running do nothing if it is?
                //I think so
                if (taskKey && taskToPromise.has(taskKey)) {
                    if (process.env.NODE_ENV !== "production") {
                        console.warn(
                            `task ${taskKey} already running, not re-dispatching.`
                        );
                    }
                    return taskToPromise.get(taskKey);
                }
                dispatch(taskLoading(taskKey));
                let taskPromise;
                try {
                    //just in case the initial handler throws
                    taskPromise = Promise.resolve(handler(orm, ...args));
                } catch (e) {
                    taskPromise = Promise.reject(e);
                }
                taskPromise.then(checkResultsForVertices(key)).then(
                    results =>
                        cleanUpTaskAndDispatch(
                            taskKey,
                            taskSuccess(taskKey, results)
                        ),
                    error => {
                        if (isUnknown(error)) {
                            console.error(
                                `Error in ORM ${
                                    taskKey
                                        ? "Task (" + taskKey + ")"
                                        : "Action"
                                } Handler`
                            );
                            console.error(error.stack);
                        }
                        return cleanUpTaskAndDispatch(
                            taskKey,
                            taskError(taskKey, error)
                        );
                    }
                );
                const cancelable = cancelablePromise(taskPromise);
                if (taskKey) {
                    taskToPromise.set(taskKey, cancelable);
                }
                return cancelable;
            case GRAPH_CANCEL:
                //this has to be handled in the middleware as it needs access to the scoped taskToPromise cache
                const { task, reason = "cancelled" } = action;
                //NB the `key` here has to be the real key. You would need to know the args if a function is
                //used to generate your task key.
                if (task && taskToPromise.has(task)) {
                    const error =
                        reason instanceof Error
                            ? reason
                            : new Error("" + reason);
                    return taskToPromise.get(task).cancel(error);
                }
                return next(action);
            case GRAPH_LOGIN_FUNCTION:
                loginTrigger = action.login;
                return next(action);
            case GRAPH_LOGIN_TRIGGER:
                fireLoginFunction();
                return next(action);
            case GRAPH_LOGOUT:
                //don't invalidate the token, but call the logout handler setup
                //by the redux implicitOauth handler
                logoutHooks.forEach(fn => fn());
                return next(action);
            case TOKEN_INVALIDATION_HOOK:
                const { hook: tokenHook } = action;
                invalidationHooks.push(tokenHook);
                return () => removeFromArray(tokenHook, invalidationHooks);
            case LOGOUT_HOOK:
                const { hook: logoutHook } = action;
                logoutHooks.push(logoutHook);
                return () => removeFromArray(logoutHook, logoutHooks);
            case GRAPH_UPDATE:
                const nextResult = checkResultsForVertices(action.key)(
                    action.result
                );
                return cleanUpTaskAndDispatch(undefined, {
                    ...action,
                    type: TASK_UPDATE,
                    result: nextResult
                });
            default:
                return next(action);
        }
    };

    const notifyFlush = [];
    const udpateQueue = [];
    //we replace the cache with our redux one.
    orm.setCache(reduxCache(dispatch, udpateQueue, notifyFlush));
    //also we proxy the `context.me` method to hook into
    //our store.
    const ormMe = orm.me.bind(orm);
    orm.me = () => {
        return ormMe().then(me => {
            dispatch(setMe(me.account._id));
            return me;
        });
    };

    //add redux shizzle
    orm.dispatch = dispatch;
    orm.getState = getState;
    //the magic
    orm.orm = orm;

    //this is for advanced use-cases.
    orm._notifyCacheFlush = fn => notifyFlush.push(fn);

    //now grab the token to wire it in.
    const token = orm.getClient().getToken();
    if (!(token instanceof ReduxToken)) {
        throw new Error(
            "could not create middleware, Graph Token not a `ReduxToken`"
        );
    }

    //allow registering of hooks for token invalidation/logout
    const invalidationHooks = [];
    const logoutHooks = [];
    const onInvalidate = () => {
        invalidationHooks.forEach(fn => fn());
    };
    //connect our token to redux
    token.connect(
        { dispatch, getState, subscribe },
        onInvalidate
    );

    //here we cache the promises of inflight tasks
    const taskToPromise = new Map();
    const cleanUpTaskAndDispatch = (key, action) => {
        if (key && taskToPromise.has(key)) {
            taskToPromise.delete(key);
        }
        //we want to dispatch after the next tick, so the vertices saved will be available.
        //but only if there are pending vertex changes...
        if (udpateQueue.length > 0) {
            return new Promise(resolve =>
                notifyFlush.push(() => resolve(dispatch(action)))
            );
        } else {
            return dispatch(action);
        }
    };

    return dispatch;
}

export default createStoreEnhancer;

//this function tries to guard against storing vertices directly in state.
const checkResultsForVertices = key => results => {
    if (!key) {
        return results; //we only care if this is a task
    }
    const check = result => {
        if (Array.isArray(result)) {
            return result.map(check);
        }
        if (isPlainObject(result)) {
            return Object.keys(result).reduce((final, prop) => {
                final[prop] = check(result[prop]);
                return final;
            }, {});
        }
        if (result && result._id && typeof result.getIds === "function") {
            //add a marker with our Symbol
            return { [$inflateVertex]: result._id };
        }
        return result;
    };
    return check(results);
};

//the redux cache implements `get`, `set`, `has`, and `delete`
//like Map. any cache needs to implement them.
function reduxCache(dispatch, queue, notify) {
    const realVertices = new Map();
    window.realVertices = realVertices;
    const flush = () => {
        if (queue.length > 0) {
            const updates = queue
                .filter((id, idx) => queue.indexOf(id) === idx)
                .map(id => {
                    const vertex = cache.get(id);
                    return {
                        id,
                        vertex: vertex ? vertex.plain() : false
                    };
                });
            dispatch(updateVertices(updates));
            queue.length = 0;
        }
        if (notify.length > 0) {
            notify.map(fn => fn());
            notify.length = 0;
        }
    };
    const cache = {
        get: id => realVertices.get(id),
        set: (id, vertex) => {
            realVertices.set(id, vertex);
            queue.push(id);
            setImmediate(flush);
        },
        delete: id => {
            realVertices.delete(id);
            queue.push(id);
            setImmediate(flush);
        }
    };
    reduxify(queue, flush, cache, notify);
    return cache;
}

const $reduxified = Symbol("reduxified");

//add mutation awareness to this.
function reduxify(queue, flush, cache, notify) {
    if (GraphVertex[$reduxified]) {
        return;
    }
    GraphVertex[$reduxified] = true;
    //this should fix most flush delay issues.
    const scheduleUpdate = res => {
        //remember to fetch the most up to date version!
        //but we probably update a vertex seperately to how createVertex might have replaced it.
        const vtx = cache.get(res._id);
        if (vtx) {
            mergeRelations(res, vtx);
            cache.set(res._id, vtx);
        } else {
            cache.set(res._id, res);
        }
        return new Promise(resolve => notify.push(() => resolve(res)));
    };

    proxify(GraphVertex.prototype, "set", scheduleUpdate);
    proxify(GraphVertex.prototype, "setCount", scheduleUpdate);
}

//helper for adding after effects
function proxify(obj, method, fn) {
    const oldMethod = obj[method];
    obj[method] = function(...args) {
        const result = oldMethod.apply(this, args);
        return fn(result);
    };
}
