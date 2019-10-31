// Rest primitives supporting both by http and websocket
// https://docs.hiro.arago.co/hiro/6.1.1/user/hiro-graph-api/ws-api.html#individual-requests

type RequestType =
  | 'get'
  | 'create'
  | 'update'
  | 'replace'
  | 'delete'
  | 'connect'
  | 'query'
  | 'writets'
  | 'streamts'
  | 'history'
  | 'getme'
  | 'me' // 'getme' for 6.x
  | 'getcontent'
  | 'meta';

export interface POJO {
  [key: string]: any;
}

interface BaseOptions {
  offset?: number;
  limit?: number;
}

export interface Meta {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface Transport {
  request(type: RequestType): Promise<any>;
  fetch(): Promise<any>;
}

export interface TimeseriesResponse {
  timestamp: number;
  value: string;
}

export interface Token {
  constructor(
    getToken: Function | Promise<string>,
    onInvalidate: Function,
    getMeta?: Function,
  ): Token;

  get(): Promise<string>;

  meta(): Meta;

  invalidate(): Promise<void>;
}

export interface Client {
  constructor(token: string | Token, endpoint: string): Client;

  http: Transport;
  ws: Transport;

  // TODO: Do we need this methods?
  request<T>(): Promise<T>;

  eventStream();

  dedupedRequest();

  introspect();
  // TODO END
  setToken(token: Token): void;

  cloneWithNewToken(token: Token): Client;

  getToken(): Token;

  me<T>(): Promise<T>;

  get<T>(id: string): Promise<T>;

  create<T>(type: string, body: POJO): Promise<T>;

  update<T>(id: string, data: POJO): Promise<T>;

  replace<T>(id: string, data: POJO): Promise<T>;

  delete<T>(id: string): Promise<T>;

  lucene<T>(
    query: string,
    options?: BaseOptions & {
      order?: string;
      fields?: string[];
      count?: boolean;
      [index: string]: any;
    },
  ): Promise<T[]>;

  ids<T>(ids: string): Promise<T[]>;

  gremlin<T>(root: string, query: string): Promise<T>;

  connect<T>(outId: string, type: string, inId: string): Promise<T>;

  //TODO: Should we extract it to timeseries extension?
  writets();

  streamts();

  writelog();

  readlog();
  //TODO END

  history();
}
