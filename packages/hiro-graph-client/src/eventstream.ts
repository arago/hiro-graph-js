/**
 *  Each instance of events stream subscribes to the /_events/ endpoint of GraphIT
 *  Filters can be applied to each stream and events are emitted.
 *  The GraphIT connection does not keep hold of these eventstreams, the consumer does.
 *  The streams are clever enough to keep track of their position and reconnect (with current
 *  filters) on the event of connection failure. Should the token expire and connection fail,
 *  if it is renewed by any other part of the app that shares the `Token` object, it will reconnect
 *  and continue to emit events.
 */
import qs from 'querystring';

import { WebSocketSubject } from 'rxjs/webSocket';
import { of, Observable, PartialObserver, Subscription, timer } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

import WebSocketTransport, {
  ensureWebSocketsAvailable,
} from './transport-websocket';

import { Token } from '.';

const RECONNECT_TIMEOUT = 5e3;
const EVENTS_PROTOCOL = 'events-1.0.0';

enum OFFSET_MSG {
  NEWEST = 'largest',
  oldest = 'smallest',
}

interface EventStreamQuery {
  groupId?: string;
  offset?: OFFSET_MSG;
  [index: string]: string | undefined;
}

export interface EventStreamOptions {
  endpoint: string;
  token: Token;
}

export interface EventStreamRequest {
  groupId?: string;
  offset?: OFFSET_MSG;
  filters?: string[];
}

export interface EventStreamFilter {
  'filter-id': string;
  'filter-type': 'jfilter';
  'filter-content': string;
}

export class StreamFilter {
  private value = '';

  constructor(value?: string) {
    if (value) {
      this.value = value;
    }
  }

  private reduce(text: (string | StreamFilter)[]) {
    return text.reduce((acc, t) => acc + `(${t.toString()})`, '');
  }

  or(...text: (string | StreamFilter)[]) {
    const v = this.reduce(text);

    this.value += `|${v}`;

    return this;
  }

  and(...text: (string | StreamFilter)[]) {
    const v = this.reduce(text);

    this.value += `&${v}`;

    return this;
  }

  toString() {
    return `${this.value}`;
  }
}

export default class EventStream {
  private _token: Token;
  private _groupId?: string;
  private _offset?: OFFSET_MSG;
  private _filters: EventStreamFilter[];
  private _transport: WebSocketTransport;

  public subscribe: <T = any>(observer?: PartialObserver<T>) => Subscription;

  constructor(
    { endpoint, token }: EventStreamOptions,
    {
      groupId,
      offset = OFFSET_MSG.NEWEST,
      filters = [],
    }: EventStreamRequest = {},
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

    const path = Object.keys(query).length > 0 ? `?${qs.stringify(query)}` : '';

    this._groupId = groupId;
    this._offset = offset;
    this._filters = filters.map((content) => ({
      'filter-id': content,
      'filter-type': 'jfilter',
      'filter-content': content,
    }));

    this._transport = new WebSocketTransport(endpoint, { api: 'events', path });

    const stream$ = new Observable<any>((subscriber) => {
      of(this._token)
        .pipe(
          mergeMap((t) => t.get()),
          map((t) => {
            const connection$ = this._transport.connect(
              t,
              EVENTS_PROTOCOL,
            ) as WebSocketSubject<EventStreamFilter>;

            this._filters.map((f) => connection$.next(f));

            // @ts-ignore
            timer(0, 5000).pipe(map(() => connection$.next({})));

            return connection$;
          }),
        )
        .subscribe(subscriber);
    });

    this.subscribe = stream$.subscribe.bind(stream$);
  }

  /**
   * Register new filter for the same connection.
   * All updates for newly registered filters will be passed to subscribed callback.
   *
   * @param filter - String
   */

  register(filter: string | StreamFilter) {
    const filterObj: EventStreamFilter = {
      'filter-id': filter.toString(),
      'filter-type': 'jfilter',
      'filter-content': filter.toString(),
    };

    this._filters.push(filterObj);

    return new Observable((subscriber) => {
      of(this._token)
        .pipe(
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
                  'filter-id': filter,
                },
              }),
              (message) => message['filter-id'] === filter,
            ),
          ),
        )
        .subscribe({
          next: (res) => {
            if (res.data) {
              subscriber.next(res.data);
            }
          },
          error: (err) => {
            if (err.code === 401) {
              this._token.invalidate();
            }

            subscriber.error(err);
          },
        });
    });
  }
}
