/**
 * This reducer handles storing vertices in the cache, keeping the token
 *  and the id of the current user.
 */
import { createSelector } from "reselect";
import { combineReducers } from "redux";
import isPlainObject from "lodash.isplainobject";
import { omit } from "./utils";
//keys
const NS = "@hiro-graph-redux";
const VERTEX_KEY = "vertices";
const TOKEN_KEY = "token";
const ME_KEY = "me";
const ROLE_KEY = "roles";
const TASK_KEY = "tasks";

//actions
import {
    SET_ME,
    SET_ROLES,
    UPDATE_VERTICES,
    SET_TOKEN,
    TASK_RESET,
    TASK_LOADING,
    TASK_SUCCESS,
    TASK_ERROR,
    TASK_UPDATE
} from "./actions";

const initialVertexState = {};
const initialTokenState = { accessToken: false, meta: {} };
const initialMeState = null;
const initialTaskState = {};
const initialRoleState = [];

//the reduce is the default export
export default {
    [NS]: combineReducers({
        [VERTEX_KEY]: (state = initialVertexState, { type, changeset }) => {
            if (type !== UPDATE_VERTICES) {
                return state;
            }
            return updateVertices(state, changeset);
        },
        [TOKEN_KEY]: (
            state = initialTokenState,
            { type, accessToken = false, meta = {} }
        ) => {
            if (type !== SET_TOKEN) {
                return state;
            }
            return { accessToken, meta };
        },
        [ME_KEY]: (state = initialMeState, { type, me = null }) => {
            if (type === SET_ME) {
                return me;
            }
            //this handles setting token AND me in one go.
            if (type === SET_TOKEN && me !== null) {
                return me;
            }
            return state;
        },
        [ROLE_KEY]: (state = initialRoleState, { type, roles = null }) => {
            if (type === SET_ROLES) {
                return roles;
            }
            if (type === SET_TOKEN && roles !== null) {
                return roles;
            }
            return state;
        },
        [TASK_KEY]: (
            state = initialTaskState,
            { type, key = false, time, result, error = false }
        ) => {
            if (!key) {
                return state;
            }
            let task;
            switch (type) {
                case TASK_LOADING:
                    //do not reset the last result/error, but set "start".
                    task = Object.assign({}, state[key], {
                        loading: true,
                        start: time
                    });
                    break;
                case TASK_ERROR:
                    task = Object.assign({}, state[key], {
                        loading: false,
                        finish: time,
                        error
                    });
                    break;
                case TASK_SUCCESS:
                    task = Object.assign({}, state[key], {
                        loading: false,
                        finish: time,
                        result,
                        error
                    });
                    break;
                case TASK_UPDATE:
                    task = Object.assign({}, state[key], { result });
                    break;
                case TASK_RESET:
                    // omit!
                    return omit(state, key);
                default:
                    //not our action.
                    return state;
            }
            return Object.assign({}, state, { [key]: task });
        }
    })
};

export const getTaskState = (task, state = false) => {
    if (state === false) {
        return s => s[NS][TASK_KEY][task];
    }
    return state[NS][TASK_KEY][task];
};

export const getTokenState = state => state[NS][TOKEN_KEY];

const $cache = Symbol("selectorCache");
// this differs from the createTaskSelector by keeping a cache
// of selectors for various combinations on the key function itself.
// this means one selector for every task key created by the function
export const dynamicTaskSelector = keyFn => {
    if (!keyFn[$cache]) {
        keyFn[$cache] = {};
    }
    return (state, ...args) => {
        const key = keyFn(...args);
        const cache = keyFn[$cache];
        if (!cache[key]) {
            cache[key] = createTaskSelector(key);
        }
        return cache[key](state);
    };
};

export const createTaskSelector = (task = false) => {
    if (!task) {
        return;
    }
    if (typeof task === "function") {
        return dynamicTaskSelector(task);
    }
    const taskVerticesIdSelector = createSelector(
        state => getTaskState(task, state),
        taskState => (taskState && taskState.result ? taskState.result : null)
    );
    const vertexSelector = createSelector(
        [getAllVertices, taskVerticesIdSelector],
        pluckVerticesInflatable
    );
    const selector = createSelector(
        [state => getTaskState(task, state), vertexSelector],
        (taskState, result) =>
            taskState && Object.assign({}, taskState, { result })
    );
    //return it as a function to have api parity with the dynamic selector
    return selector;
};

export const $inflateVertex = Symbol("inflate vertex");

const getAllVertices = state => state[NS][VERTEX_KEY];

//can do all sorts but needs "inflatable markers"
const pluckVerticesInflatable = (vertices, object) => {
    if (!object) {
        return object;
    }
    if (object[$inflateVertex]) {
        return vertices[object[$inflateVertex]];
    }
    if (Array.isArray(object)) {
        return object.map(v => pluckVerticesInflatable(vertices, v));
    }
    if (isPlainObject(object)) {
        return Object.keys(object).reduce((final, key) => {
            final[key] = pluckVerticesInflatable(vertices, object[key]);
            return final;
        }, {});
    }
    //none of the above. leave as is.
    return object;
};

// this only works on ids or arrays of ids, or plain objects with keys of one of those 3.
// if you pass anything else it will be returned as is.
const pluckVerticesSimple = (vertices, idShape) => {
    if (Array.isArray(idShape)) {
        return idShape.map(v => pluckVerticesSimple(vertices, v));
    }
    if (typeof idShape === "string") {
        return vertices[idShape];
    }
    if (isPlainObject(idShape)) {
        return Object.keys(idShape).reduce((final, key) => {
            final[key] = pluckVerticesSimple(vertices, idShape[key]);
        }, {});
    }
    // none of the above. leave it.
    return idShape;
};

//this gets the "me" id
export const getMyId = state => state[NS][ME_KEY];
export const getMyRoles = state => state[NS][ROLE_KEY];

//this is the exported one that users will use.
// pass in function to get your ids from state and
// this will return a memoized selector.
// It returns plain data objects, rather than Vertex objects
export const createVertexSelector = functionOfStateToGetIds =>
    createSelector(
        [getAllVertices, functionOfStateToGetIds],
        pluckVerticesSimple
    );

//this is a exported one for one-off use. no reselect
//probably for use in actions.
export const getVertices = state => idOrIds =>
    pluckVerticesSimple(state[NS][VERTEX_KEY], idOrIds);

// This is the internal action handler for updating the vertex state.
const updateVertices = (stateBefore, changeset = []) => {
    if (changeset.length === 0) {
        return stateBefore;
    }
    //copy the old state
    const stateAfter = Object.assign({}, stateBefore);

    //apply changes
    //we should merge changesets.
    changeset.forEach(({ id, vertex = false }) => {
        if (!vertex && id in stateAfter) {
            //delete.
            delete stateAfter[id];
        }
        if (vertex) {
            stateAfter[id] = vertex;
        }
    });

    //return new state
    return stateAfter;
};
