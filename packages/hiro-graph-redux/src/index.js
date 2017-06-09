import {
    createAction,
    createTask,
    createTaskFactory,
    createTaskAction
} from "./create-action";
import createStoreEnhancer from "./middleware";
import { setToken, cancelTask, resetTask, doLogin, doLogout } from "./actions";
import graphReducer, {
    createTaskSelector,
    createVertexSelector,
    getTaskState,
    getTokenState,
    getMyId,
    getMyRoles
} from "./reducer";
import ReduxToken from "./token";
import whenTask from "./when-task";
import implicitOauth, { loginTaskSelector } from "./implicit-oauth";

//a tiny wrapper to make it easier on the caller
export const createToken = (...args) => new ReduxToken(...args);

export {
    graphReducer,
    createVertexSelector,
    createTaskSelector,
    createAction,
    createTask,
    createTaskFactory,
    createTaskAction,
    cancelTask,
    resetTask,
    createStoreEnhancer,
    setToken,
    getTaskState,
    getMyId,
    getMyRoles,
    getTokenState,
    whenTask,
    implicitOauth,
    loginTaskSelector,
    doLogin,
    doLogout
};
