export const GRAPH_ACTION = "@arago/redux-graph:action";
export const GRAPH_CANCEL = "@arago/redux-graph:cancel";
export const GRAPH_LOGIN = "@arago/redux-graph:login";
export const GRAPH_LOGOUT = "@arago/redux-graph:logout";
export const GRAPH_UPDATE = "@arago/redux-graph:update";
export const LOGOUT_HOOK = "@arago/redux-graph:logout-hook";
export const TOKEN_INVALIDATION_HOOK =
    "@arago/redux-graph:token-invalidation-hook";
export const UPDATE_VERTICES = "@arago/redux-graph:update-vertices";
export const SET_TOKEN = "@arago/redux-graph:set-token";
export const SET_ME = "@arago/redux-graph:set-me";
export const SET_ROLES = "@arago/redux-graph:set-roles";
export const TASK_LOADING = "@arago/redux-graph:task-loading";
export const TASK_SUCCESS = "@arago/redux-graph:task-success";
export const TASK_UPDATE = "@arago/redux-graph:task-update";
export const TASK_ERROR = "@arago/redux-graph:task-error";
export const TASK_RESET = "@arago/redux-graph:task-reset";

//this is the action to set a newly acquired token into the
//connection
export function setToken(accessToken, meta = {}, me, roles) {
    return { type: SET_TOKEN, accessToken, meta, me, roles };
}

//register a hook to trigger on token invalidation.
export function setOnTokenInvalidate(hook) {
    return { type: TOKEN_INVALIDATION_HOOK, hook };
}

//register a hook to trigger on logout
export function setOnLogoutHook(hook) {
    return { type: LOGOUT_HOOK, hook };
}

// this is used internally to add vertices in batches to the
// redux state (not expose to public API directly)
export function updateVertices(changeset = []) {
    return { type: UPDATE_VERTICES, changeset };
}

// used internally to keep track of "me" for the current token.
export function setMe(me) {
    return { type: SET_ME, me };
}

export function setRoles(roles) {
    return { type: SET_ROLES, roles };
}

export function taskLoading(key = false) {
    return { type: TASK_LOADING, key, time: Date.now() };
}

export function taskSuccess(key = false, result) {
    return { type: TASK_SUCCESS, key, result, time: Date.now() };
}

export function taskError(key = false, error) {
    return { type: TASK_ERROR, key, error, time: Date.now() };
}

export function cancelTask(key = false, reason) {
    return { type: GRAPH_CANCEL, task: key, reason };
}

//takes a task back to an "unstarted" state.
export function resetTask(key = false) {
    return { type: TASK_RESET, key };
}

export function doLogin() {
    return { type: GRAPH_LOGIN };
}

export function doLogout() {
    return { type: GRAPH_LOGOUT };
}
