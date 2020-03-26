/**
 *  Websocket Transport for the GraphIT REST API.
 */
import { w3cwebsocket as WS } from 'websocket';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { map, catchError, toArray, mergeMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import uid from 'uid';

import { GRAPH_WS_API_BASE } from './api-version';

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

export interface WebSocketRequestOptions<T> extends RequestOptions {
  asStream?: boolean;
}

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
  request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: WebSocketRequest,
    reqOptions: WebSocketRequestOptions<T> = {},
  ) {
    //the connect call ensures the websocket is connected before continuing.
    const id = uid();

    // @todo send requests to a pipe for deduping before triggering request?

    const response$ = new Observable<T>((subscriber) => {
      of(token)
        .pipe(
          mergeMap((t) => t.get() as Promise<string>),
          map(
            (t) =>
              [t, this.connect(t)] as [
                string,
                WebSocketSubject<WebSocketResponse<T>>,
              ],
          ),
          mergeMap(([_TOKEN, connection]) =>
            connection
              .multiplex(
                () => ({
                  _TOKEN,
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
                map((res: WebSocketResponse<T>) => {
                  if (res.error) {
                    throw res.error;
                  }

                  return res;
                }),
              ),
          ),
        )
        .subscribe({
          next: (res) => {
            if (res.body) {
              subscriber.next(res.body);
            }

            if (!res.more) {
              subscriber.complete();
            }
          },
          error: (err) => {
            if (err.code === 401) {
              token.invalidate();
            }

            subscriber.error(err);
          },
        });
    });

    if (reqOptions.asStream) {
      return response$;
    }

    return response$.pipe(toArray()).toPromise();
  }

  /**
   *  Return a promise for the connected websocket.
   */
  connect(token: string) {
    if (!this.connection) {
      this.connection = webSocket({
        url: this.endpoint,
        WebSocketCtor: WS as any,
        protocol: [GRAPH_API_PROTOCOL, `token-${token}`],
      });
    }

    return this.connection;
  }
}
