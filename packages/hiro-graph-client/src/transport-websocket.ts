/**
 *  Websocket Transport for the GraphIT REST API.
 */
import { w3cwebsocket as WS } from 'websocket';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { map, filter, catchError, toArray } from 'rxjs/operators';
import { Subject, of, Observable, Observer } from 'rxjs';
import uid from 'uid';

import { create as createError, connectionClosedBeforeSend } from './errors';
import timer from './timer';
import { GRAPH_WS_API_BASE } from './api-version';

const noop = () => {};

export const webSocketsAvailable = WS !== undefined && WS !== null;

// throw if websockets NOT available
export const ensureWebSocketsAvailable = () => {
  if (!webSocketsAvailable) {
    throw new Error('WebSockets are not available');
  }
};

// The graph websocket api accepts a protocol
export const GRAPH_API_PROTOCOL = 'graph-2.0.0';

export type WebSocketRequestType =
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
  | 'getme';

export interface WebSocketRequest {
  type: WebSocketRequestType;
  headers: any; // @todo
  body: any; // @todo
}

export interface WebSocketResponse<T = any> {
  id: string;
  more: boolean;
  multi: boolean;
  body: T | null;
  error?: any;
}

type Token = import('./token').default; // @todo - Replce with import type after updating eslint
type RequestOptions = import('node-fetch').RequestInit;

export interface WebSocketRequestOptions<T> extends RequestOptions {}

export default class WebSocketTransport {
  private endpoint: string;
  private connection: WebSocketSubject<any> | undefined;

  constructor(endpoint: string) {
    ensureWebSocketsAvailable();
    this.endpoint = endpoint
      .replace(/^http/, 'ws') //replace http(s) with ws(s)
      .replace(/\/?$/, `${GRAPH_WS_API_BASE}/`); // replace possible trailing slash with api endpoint
  }

  /**
   *  Make a request. Most of the work is done by the connect function.
   */
  async request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: WebSocketRequest,
    reqOptions: WebSocketRequestOptions<T> = {},
  ) {
    //the connect call ensures the websocket is connected before continuing.

    const _token = await token.get();
    const connection = await this.connect(token);
    const id = uid();

    const response$: Observable<WebSocketResponse<
      T
    >> = (connection as WebSocketSubject<WebSocketResponse<T>>)
      .multiplex(
        () => ({
          _TOKEN: _token,
          id,
          type,
          headers: {
            ...headers,
            ...(reqOptions.headers || {}),
          },
          body,
        }),
        () => ({}),
        (message) => message.id === id || message.error,
      )
      .pipe(
        catchError((err) =>
          of({ error: { message: err.reason, code: err.code } }),
        ),
        map((res) => {
          if (res.error) {
            throw res.error;
          }

          return res;
        }),
      );

    // connection
    //   .pipe(
    //     catchError((err) =>
    //       of({ error: { message: err.reason, code: err.code } }),
    //     ),
    //     map((res) => {
    //       if (res.error) {
    //         throw res.error;
    //       }

    //       return res;
    //     }),
    //     filter((res) => res.id === id),
    //   )
    //   .subscribe({
    //     next: (res) => {
    //       subject$.next(res.body);

    //       if (!res.more) {
    //         subject$.complete();
    //       }
    //     },
    //     error: (err) => {
    //       if (err.code === 401) {
    //         token.invalidate();
    //       }

    //       subject$.error(err);
    //     },
    //   });

    // connection.next({
    //   _TOKEN: _token,
    //   id,
    //   type,
    //   headers: {
    //     ...headers,
    //     ...(reqOptions.headers || {}),
    //   },
    //   body,
    // });

    return response$.pipe(toArray()).toPromise();
  }

  /**
   *  Return a promise for the connected websocket.
   */
  async connect(token: Token) {
    if (!this.connection) {
      const _token = await token.get();

      this.connection = webSocket({
        url: this.endpoint,
        WebSocketCtor: WS as any,
        protocol: [GRAPH_API_PROTOCOL, `token-${_token}`],
      });
    }

    return this.connection;
  }
}
