/**
 *  This is the redux action creator creator and a task action creator creator creator
 *
 *  Super enterprisey!
 */
import { GRAPH_ACTION, GRAPH_UPDATE } from "./actions";
import { createTaskSelector } from "./reducer";

const IN_DEV = process.env.NODE_ENV !== "production";

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
    if (IN_DEV && /^@internal:/.test(key)) {
        console.groupCollapsed(
            `%c@arago/redux-graph internal key: %c${key}`,
            "background:#ffa",
            "font-weight:bold;background:#666;padding:3px;border-radius:3px;color:#fff;"
        );
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
