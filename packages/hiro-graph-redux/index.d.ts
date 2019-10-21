import { StoreEnhancerStoreCreator, Store, Dispatch, AnyAction } from 'redux';
import { Token } from '@hiro-graph/client';
import Context from '@hiro-graph/orm';

export type ITaskShape<T = any> = {
  error?: Error | false | string | null;
  loading?: boolean;
  result: T;
  start?: number;
  finish?: number;
};

interface ITokenState {
  accessToken: string;
}

type getPromiseType<T> = T extends Promise<infer U> ? U : T;

export const graphReducer: () => void;
export const createVertexSelector: () => void;
export const createTaskSelector: () => void;
export const createAction: () => void;
export const createTask: <
  T = undefined,
  U extends (...args: any[]) => any = (...args: any[]) => any
>(
  action: U,
  selector?: any,
) => {
  action: (...args: any) => AnyAction;
  selector: (
    ...args: any
  ) => T extends undefined
    ? ITaskShape<getPromiseType<ReturnType<U>>>
    : ITaskShape<T>;
  update: (...args: any) => void;
};
export const createTaskFactory: () => void;
export const createTaskAction: () => void;
export const createToken: () => string;
export const cancelTask: (task: ITaskShape) => void;
export const resetTask: (key: string) => void;
export const createStoreEnhancer: (
  ctx: Context,
) => <T = {}>(a: T) => StoreEnhancerStoreCreator;
export const setToken: () => void;
export const getTaskState: (state: any) => any;
export const getMyId: (state: any) => string;
export const getMyRoles: (state: any) => any;
export const getTokenState: (state: any) => ITokenState;

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
  options: IWhenTaskOptions<T, R>,
) => R;

interface IOAuthOptions {
  url: string;
  logoutUri: string;
  clientId: string;
  store: Store;
  dispatch: Dispatch;
}

type AuthStrategy = ({
  url,
  dispatch,
}: {
  url: string;
  dispatch: Dispatch;
}) => {
  [index: string]: (...args: any) => any;
};

export const implicitOauth: (
  oauth: IOAuthOptions,
  strategy?: AuthStrategy | 'redirect',
) => void;
export const loginTaskSelector: (state: any) => ITaskShape;
export const doLogin: () => void;
export const doLogout: () => void;
export const setOnLogoutHook: () => void;

export class ReduxToken extends Token {}
