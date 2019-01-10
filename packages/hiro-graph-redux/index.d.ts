import Context from "@hiro-graph/orm";
import { StoreEnhancerStoreCreator, Store, Dispatch, AnyAction } from "redux";
import { Token } from "@hiro-graph/client";

export type ITaskShape<T = any> = {
    error?: Error | false | string | null;
    loading?: boolean;
    result: T;
    start?: number;
    finish?: number;
};

export const graphReducer: () => void;
export const createVertexSelector: () => void;
export const createTaskSelector: () => void;
export const createAction: () => void;
export const createTask: <T = any>(
    action: any,
    selector?: any
) => {
    action: (...args: any) => AnyAction;
    selector: (...args: any) => ITaskShape<T>;
    update: (...args: any) => void;
};
export const createTaskFactory: () => void;
export const createTaskAction: () => void;
export const createToken: () => string;
export const cancelTask: () => void;
export const resetTask: () => void;
export const createStoreEnhancer: (
    ctx: Context
) => <T = {}>(a: T) => StoreEnhancerStoreCreator;
export const setToken: () => void;
export const getTaskState: () => void;
export const getMyId: () => void;
export const getMyRoles: () => void;
export const getTokenState: () => void;

interface IWhenTaskOptions<T, R> {
    pre?: () => R;
    loading?: () => R;
    reloading?: () => R;
    ok?: (res: T) => R;
    error?: (err: Error) => R;
    ignoreReloadingIfOK?: boolean;
    ignoreReloadingIfError?: boolean;
}

export const whenTask: <T = any, R = any>(
    task: ITaskShape<T>,
    options: IWhenTaskOptions<T, R>
) => R;

interface IOAuthOptions {
    url: string;
    logoutUri: string;
    clientId: string;
    store: Store;
    dispatch: Dispatch;
}

type AuthStrategy = (
    { url, dispatch }: { url: string; dispatch: Dispatch }
) => {
    [index: string]: (...args: any) => any;
};

export const implicitOauth: (
    oauth: IOAuthOptions,
    strategy: AuthStrategy
) => void;
export const loginTaskSelector: () => void;
export const doLogin: () => void;
export const doLogout: () => void;
export const setOnLogoutHook: () => void;

export class ReduxToken extends Token {}
