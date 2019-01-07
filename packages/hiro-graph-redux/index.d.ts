export type ITaskShape<T = any> = {
    error?: Error | false | string | null;
    loading?: boolean;
    result: T;
    start?: number;
};

export const graphReducer: () => void;
export const createVertexSelector: () => void;
export const createTaskSelector: () => void;
export const createAction: () => void;
export const createTask: <T = any>(
    action: any,
    selector: any
) => {
    action: (...args: any) => void;
    selector: (...args: any) => ITaskShape<T>;
};
export const createTaskFactory: () => void;
export const createTaskAction: () => void;
export const cancelTask: () => void;
export const resetTask: () => void;
export const createStoreEnhancer: () => void;
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
export const implicitOauth: () => void;
export const loginTaskSelector: () => void;
export const doLogin: () => void;
export const doLogout: () => void;
export const setOnLogoutHook: () => void;
