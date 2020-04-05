/**
 *  Websocket Transport for the GraphIT REST API.
 */
import { w3cwebsocket as WS } from 'websocket';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { map, catchError, mergeMap, reduce } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import uid from 'uid';

import { GraphRequest, GraphTransport } from './types/graph';
import { Endpoint, WS_API } from './endpoint';

import { Token } from '.';

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
  forceHTTP?: boolean;
}

export default class WebSocketTransport implements GraphTransport {
  private endpoint: Endpoint<true>;
  private url: string;
  private connection: WebSocketSubject<any> | undefined;

  constructor(
    endpoint: string,
    { api = 'graph', path }: WebSocketRequestOptions,
  ) {
    ensureWebSocketsAvailable();
    this.endpoint = new Endpoint(endpoint, true);
    this.url = this.endpoint.api(api, path);
  }

  /**
   *  Make a request. Most of the work is done by the connect function.
   */
  request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: GraphRequest,
    reqOptions: WebSocketRequestOptions = {},
  ) {
    //the connect call ensures the websocket is connected before continuing.
    const id = uid();

    // @todo send requests to a pipe for deduping before triggering request?

    const response$ = new Observable<T>((subscriber) => {
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
                (message) => message.id === id || message.error,
              )
              .pipe(
                catchError((err) => {
                  if (err.type === 'error') {
                    return of({
                      error: {
                        message: `Error creating websocket for ${this.url}`,
                        code: 500,
                      },
                    });
                  }

                  return of({
                    error: {
                      message: err.reason || err.message,
                      code: err.code || 500,
                    },
                  });
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
    }).pipe(
      reduce((acc, res) => {
        acc.push(res);

        return acc;
      }, [] as T[]),
    );

    return response$;
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
      });
    }

    return this.connection;
  }
}
