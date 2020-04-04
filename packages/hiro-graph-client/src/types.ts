import { RequestInit } from 'node-fetch';

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
  headers: any; // @todo
  body: any; // @todo
}

export interface RequestOptions extends globalThis.RequestInit {
  token?: string;
  raw?: boolean;
}
