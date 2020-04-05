import { Observable } from 'rxjs';

export type GraphRequestType =
  | 'get'
  | 'ids'
  | 'create'
  | 'update'
  | 'replace'
  | 'delete'
  | 'connect'
  | 'disconnect'
  | 'query'
  | 'writets'
  | 'streamts'
  | 'history'
  | 'meta'
  | 'getme';

export interface GraphRequest {
  type: GraphRequestType;
  headers?: any; // @todo
  body?: any; // @todo
}

export type RequestOptions = globalThis.RequestInit;

export interface GraphTransport {
  request: <T = any>(token: any, request: GraphRequest) => Observable<T[]>;
}
