/**
 *  This is the redux action creator creator and a task action creator creator creator
 *
 *  Super enterprisey!
 */
import { GRAPH_ACTION, GRAPH_UPDATE } from "./actions";
import { createVertexSelector, createTaskSelector } from "./reducer";
import whenTask from "./when-task";

const IN_DEV = process.env.NODE_ENV !== "production";

const consoleHasGroup =
    console &&
    typeof console.groupCollapsed === "function" &&
    typeof console.groupEnd === "function";

//this is what the user calls with their handler function.
//the returned function is called with args in the middleware
//creates a task with no key (no concurrency control)
const createAction = handler => createTask(handler, false).action;

// like the above but allows us to create tasks.
// the difference is that we have a key/function to
// specify an identifier for the task
// so the return value waits for a key and
// then returns bot the action creator AND the task selector
// this is a convenience as it greatly simplifies use and
// especially re-use of the task handler functions.
const createTask = (handler, key = createTaskKey()) => {
    if (IN_DEV && /^@internal:/.test(key) && consoleHasGroup) {
        console.groupCollapsed(`hiro-graph-redux internal key: ${key}`);
        console.log(handler.toString());
        console.groupEnd();
    }
    return {
        action: (...args) => {
            //which returns an object that will be detected by the middleware.
            return { type: GRAPH_ACTION, args, handler, key };
        },
        selector: createTaskSelector(key),
        update: (result, ...args) => {
            const taskKey = typeof key === "function" ? key(...args) : key;
            return {
                type: GRAPH_UPDATE,
                key: taskKey,
                result
            };
        },
        key
    };
};

//partial application version of createTask
const createTaskFactory = handler => key => createTask(handler, key);

//This creates just the action part of a task.
//The difference between this and `createAction`
//is `createAction` has no key. but this *must* have
//a key.
const createTaskAction = (handler, key = false) => {
    if (!key) {
        throw new Error(
            `createTaskAction expects a key to be passed as the second argument.`
        );
    }
    return createTask(handler, key).action;
};

export { createAction, createTask, createTaskFactory, createTaskAction };

//generate a non-conflicting (but hopefully deterministic within the app).
let globalKeyId = 0;
const createTaskKey = () => `@internal:${globalKeyId++}`;

// The live task is a 2-phase process.
// phase 1 (kernel space) is the normal task execution environment
// phase 2 (user space) is the normal react/redux/component-side environment (e.g. with plain, immutable objects).
//
// The idea is that your task fetches data, but returns the vertex that forms the dependency of the data
// you actually want.
//
// That is if you want the "foo" edges of some "bar" vertex, then you really want to return "bar" as
// it will update when it's "foo" edges change and you want to react to that.

// this is important for being empty AND being a unique object instance.
const emptyArray = [];

/**
 *  fetch must return dependent vertices.
 *  interpreter runs on "plain" graph objects, not Vertex instances
 *  the interpreter is passed the result of the task, and the `state`
 *  object, in case you wish to use further selectors in it.
 */
export function createLiveTask(fetch, interpreter = x => x, key = false) {
    const createdTask = createTask(fetch, key);
    const { selector } = createdTask.selector;
    const resultSelector = createVertexSelector(state => {
        let value = emptyArray;
        whenTask(createdTask.selector(state), {
            ok: res => {
                value = interpreter(res, state);
            }
        });
        return value;
    });
    const liveSelector = state => {
        const task = selector(state);
        const result = resultSelector(state);
        if (result !== emptyArray) {
            return { ...task, result };
        }
        return task;
    };
    return { ...createdTask, selector: liveSelector };
}
