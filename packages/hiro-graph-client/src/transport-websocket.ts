/**
 *  Websocket Transport for the GraphIT REST API.
 */
import * as WebSocket from 'isomorphic-ws';
import { nanoid } from 'nanoid';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { of, Observable, map, catchError, mergeMap } from 'rxjs';

import { GraphTransport, GraphRequestType } from './types';
import { Endpoint, WS_API } from './endpoint';
import { Token } from './token';

// @ts-ignore - Try to make all build types happy
const WS = WebSocket.default;

export const webSocketsAvailable = WS !== undefined && WS !== null;

// throw if websockets NOT available
export const ensureWebSocketsAvailable = () => {
  if (!webSocketsAvailable) {
    throw new Error('WebSockets are not available');
  }
};

// The graph websocket api accepts a protocol
export const GRAPH_API_PROTOCOL = 'graph-2.0.0';

export interface WebSocketResponse<T = any> {
  id: string;
  more: boolean;
  multi: boolean;
  body: T | null;
  error?: any;
}

export interface WebSocketRequestOptions {
  api?: WS_API;
  path?: string;
  query?: Record<string, any>;
  forceHTTP?: boolean;
}

export class WebSocketTransport implements GraphTransport {
  private endpoint: Endpoint<true>;
  private url: string;
  public connection: WebSocketSubject<any> | undefined;

  constructor(
    endpoint: string,
    { api = 'graph', path, query }: WebSocketRequestOptions = {},
  ) {
    ensureWebSocketsAvailable();
    this.endpoint = new Endpoint(endpoint, true);
    this.url = this.endpoint.api(api, path, query);
  }

  /**
   *  Make a request. Most of the work is done by the connect function.
   */
  request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: GraphRequestType,
  ) {
    const id = nanoid();

    // @todo send requests to a pipe for deduping before triggering request?

    const response$ = new Observable<WebSocketResponse<T>>((subscriber) => {
      of(token)
        .pipe(
          mergeMap((t) => t.get()),
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
                  headers,
                  body,
                }),
                () => ({}),
                (message) => message && (message.id === id || message.error),
              )
              .pipe(
                catchError((err) => {
                  if (err.type === 'error') {
                    return of({
                      error: {
                        message: `Error creating websocket for ${this.url}`,
                        code: 500,
                      },
                    } as WebSocketResponse);
                  }

                  return of({
                    error: {
                      message: err.reason || err.message,
                      code: err.code || 500,
                    },
                  } as WebSocketResponse);
                }),
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
            if (res.body !== null && res.body !== undefined) {
              subscriber.next(res);
            }

            if (res.multi === false || !res.more) {
              subscriber.complete();
            }
          },
          error: (err) => {
            subscriber.error(err);
          },
        });
    });

    return response$.pipe(map((res) => res.body as T));
  }

  /**
   *  Return a promise for the connected websocket.
   */
  connect(token: string, protocol?: string) {
    if (!this.connection) {
      this.connection = webSocket({
        url: this.url,
        WebSocketCtor: WS as any,
        protocol: [protocol || GRAPH_API_PROTOCOL, `token-${token}`],
        deserializer: ({ data }) => {
          if (typeof data !== 'string') {
            return { body: null };
          }

          try {
            return JSON.parse(data);
          } catch (e) {
            return { body: null, error: e };
          }
        },
      });
    }

    return this.connection;
  }

  close() {
    if (this.connection) {
      this.connection.complete();
    }
  }
}
