/**
 *  Each instance of events stream subscribes to the /_events/ endpoint of GraphIT
 *  Filters can be applied to each stream and events are emitted.
 *  The GraphIT connection does not keep hold of these eventstreams, the consumer does.
 *  The streams are clever enough to keep track of their position and reconnect (with current
 *  filters) on the event of connection failure. Should the token expire and connection fail,
 *  if it is renewed by any other part of the app that shares the `Token` object, it will reconnect
 *  and continue to emit events.
 */

import { WebSocketSubject } from 'rxjs/webSocket';
import { of } from 'rxjs';
import { mergeMap, map, filter, catchError } from 'rxjs/operators';

import {
  WebSocketTransport,
  ensureWebSocketsAvailable,
} from './transport-websocket';
import { JFilter, JFilterType } from './jfilter';
import {
  OFFSET_MSG,
  EventStreamRequest,
  EventStreamResponse,
} from './types/index';

import { Token } from '.';

const RECONNECT_TIMEOUT = 5e3;
const EVENTS_PROTOCOL = 'events-1.0.0';

export interface EventStreamQuery {
  groupId?: string;
  offset?: OFFSET_MSG;
  delta?: boolean;
  [index: string]: string | boolean | undefined;
}

export interface EventStreamOptions {
  endpoint: string;
  token: Token;
}

export interface EventStreamFilter {
  'filter-id': string;
  'filter-type': 'jfilter';
  'filter-content': string;
}

export class EventStream {
  private _token: Token;
  private _transport: WebSocketTransport;

  constructor(
    { endpoint, token }: EventStreamOptions,
    { groupId, delta, offset = OFFSET_MSG.NEWEST }: EventStreamRequest = {},
  ) {
    ensureWebSocketsAvailable();
    this._token = token;

    const query: EventStreamQuery = {};

    if (groupId) {
      query.groupId = groupId;
    }

    if (offset) {
      query.offset = offset;
    }

    if (delta) {
      query.delta = delta;
    }

    this._transport = new WebSocketTransport(endpoint, {
      api: 'events',
      query,
    });
  }

  /**
   * Register new filter for the same connection.
   * All updates for newly registered filters will be passed to subscribed callback.
   *
   * @param filter - String
   */

  register<T extends object>(jfilter: JFilterType) {
    const filterObj: EventStreamFilter = {
      'filter-id': jfilter.toString(),
      'filter-type': 'jfilter',
      'filter-content': jfilter.toString(),
    };

    return of(this._token).pipe(
      mergeMap((t) => t.get()),
      map(
        (t) =>
          this._transport.connect(t, EVENTS_PROTOCOL) as WebSocketSubject<
            EventStreamFilter
          >,
      ),
      mergeMap((connection) =>
        connection.multiplex(
          () => ({
            type: 'register',
            args: filterObj,
          }),
          () => ({
            type: 'unregister',
            args: {
              'filter-id': jfilter,
            },
          }),
          (res: any) => res.body && jfilter.test(JFilter.transform(res)),
        ),
      ),
      filter(Boolean),
      map((res: any) => res as EventStreamResponse<T>),
      catchError((err) => {
        if (err.code === 401) {
          this._token.invalidate();
        }

        throw err;
      }),
    );
  }

  close() {
    this._transport.close();
  }
}
