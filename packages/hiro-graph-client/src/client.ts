/**
 *  A GraphIT Client
 *
 *  It will use Websockets where possible and fall back to HTTP where WebSockets not supported.
 *  Event streams require WebSockets so those will not work witout websocket support.
 *  The connection requires a `Token`.
 */
import { catchError, map, retryWhen, concatMap, delay } from 'rxjs/operators';
import { of, throwError, EMPTY } from 'rxjs';

import {
  WebSocketTransport,
  webSocketsAvailable,
  WebSocketRequestOptions,
} from './transport-websocket';
import { HttpTransport } from './transport-http';
import * as Errors from './errors';
import { fixedToken } from './token';
import { EventStream, EventStreamRequest } from './eventstream';
import {
  GraphTransport,
  GraphRequest,
  TimeseriesResponse,
  HistoryQueryOptions,
} from './types';
import {
  GremlinQueryFunction,
  GremlinQuery,
  gremlin as CreateGremlin,
} from './gremlin';
import { Lucene, LuceneQueryOptions, lucene as CreateLucene } from './lucene';

import { Token } from '.';

export interface ClientOptions {
  endpoint: string;
  token: string | Token;
}

export type TransportOrOptions = WebSocketRequestOptions | GraphTransport;

const isTransport = (t: TransportOrOptions): t is GraphTransport =>
  'request' in t && typeof t.request === 'function';

export class Client {
  private endpoint: string;
  private http: HttpTransport;
  private transport: GraphTransport;
  private token: Token;

  constructor(
    { endpoint, token }: ClientOptions,
    transportOrOptions: TransportOrOptions = {},
  ) {
    this.endpoint = endpoint;

    this.token = this.setToken(token);

    //create the transports.
    //the http is for http only endpoint, e.g. the /_ki/* and /_variable/* servlets
    this.http = new HttpTransport(endpoint);

    // This is the main transport for most of the api.
    // Use Websocket if available (except if specifically disabled)
    // fallback to http, or use given transport
    // duck type the final parameter
    if (isTransport(transportOrOptions)) {
      this.transport = transportOrOptions;
    } else if (webSocketsAvailable && !transportOrOptions.forceHTTP) {
      //All a transport needs to implement is "request"
      this.transport = new WebSocketTransport(endpoint, transportOrOptions);
    } else {
      if (!webSocketsAvailable) {
        console.warn(
          'WebSockets not available, falling back to HTTP transport',
        );
      }

      this.transport = this.http;
    }
  }

  setToken(token: string | Token) {
    this.token = typeof token === 'string' ? fixedToken(token) : token;

    return this.token;
  }

  // NB this is not held anywhere in this instance, but returned
  // to the caller. It only connects when it's subscribe() method
  // is called.
  eventStream(
    filters: string | string[] = [],
    { groupId, offset, scopeId }: Omit<EventStreamRequest, 'filters'> = {},
  ) {
    const filtersArray = Array.isArray(filters) ? filters : [filters];

    if (filtersArray.length === 0) {
      // add a default one that catches everything
      filtersArray.push('(element.ogit/_id = *)');
    }

    return new EventStream(
      { endpoint: this.endpoint, token: this.token },
      { groupId, offset, scopeId, filters: filtersArray },
    );
  }

  /**
   *  Make a clone of this connection, but with new
   */
  cloneWithNewToken(newToken: Token) {
    const cloned = new Client(
      {
        endpoint: this.endpoint,
        token: newToken,
      },
      this.transport,
    );

    return cloned;
  }

  /**
   *  Make a generic request. The transport will handle the details, we handle the retry.
   *  We use `this.transport` which is websocket if available.
   */
  request<T>({ type, headers = {}, body = {} }: GraphRequest, maxRetries = 1) {
    let retries = 0;

    return this.transport
      .request<T>(this.token, { type, headers, body })
      .pipe(
        retryWhen((err$) =>
          err$.pipe(
            concatMap((res) => {
              const closed = res === Errors.connectionClosedBeforeSend;

              // Always handle early close
              if (closed) {
                return of(res);
              }

              if (res.code === 401) {
                this.token.invalidate();
              }

              // Retry retryable error until max retries
              if (
                retries < maxRetries &&
                (res.isRetryable || res.code === 888 || res.code === 401)
              ) {
                retries += 1;

                return of(res);
              }

              return throwError(res);
            }),
            delay(1000),
          ),
        ),
      );
  }

  getToken() {
    return this.token;
  }

  /**
   *  Core GraphIT REST API methods
   *  Prefer websocket transport
   *  The servlets for e.g. /_ki/validate are added using mixins
   */

  /**
   *  Get a single item by ID
   */
  get<T>(id: string, options: { listMeta?: boolean } = {}) {
    const headers = { 'ogit/_id': id } as any;

    if (options.listMeta) {
      headers.listMeta = true;
    }

    return this.request<T>({ type: 'get', headers });
  }

  /**
   *  Get the node for the owner of this token
   */
  me<T>() {
    return this.request<T>({
      type: 'getme',
      body: {},
      headers: { profile: true, 'me-type': 'account' },
    });
  }

  /**
   *  Create a new node
   */
  create<T>(type: string, data = {}, options: { waitForIndex?: boolean } = {}) {
    const headers: Record<string, string> = { 'ogit/_type': type };

    if (options.waitForIndex) {
      headers.waitForIndex = 'true';
    }

    return this.request<T>({ type: 'create', headers, body: data });
  }

  /**
   *  Update a Node
   */
  update<T>(id: string, data = {}, options: { waitForIndex?: boolean } = {}) {
    const headers: Record<string, string> = { 'ogit/_id': id };

    if (options.waitForIndex) {
      headers.waitForIndex = 'true';
    }

    return this.request<T>({ type: 'update', headers, body: data });
  }

  /**
   *  Replace a Node, optionally `upsert`
   */
  replace<T>(
    id: string,
    data: Partial<T> = {},
    options: { waitForIndex?: boolean; createIfNotExists?: string } = {},
  ) {
    const { createIfNotExists = false, waitForIndex = false } = options;
    //createIfNotExists should contain the "ogit/_type" to create if the node doesn't exist,
    //and nothing otherwise
    const headers: Record<string, string> = { 'ogit/_id': id };

    if (createIfNotExists) {
      Object.assign(headers, {
        createIfNotExists: 'true',
        'ogit/_type': createIfNotExists,
      });
    }

    if (waitForIndex) {
      headers.waitForIndex = 'true';
    }

    return this.request<T>({ type: 'replace', headers, body: data });
  }

  /**
   *  Delete a node/edge
   *
   *  We don't handle the 404/409 here. or should we?
   */
  delete<T>(id: string, options: { waitForIndex?: boolean } = {}) {
    const { waitForIndex = false } = options;
    const headers: Record<string, string> = { 'ogit/_id': id };

    if (waitForIndex) {
      headers.waitForIndex = 'true';
    }

    return this.request<T>({ type: 'delete', headers });
  }

  /**
   *  This is a vertices query
   */

  lucene<T>(
    query: string | Lucene.Query = '',
    {
      limit = 50,
      offset = 0,
      order,
      fields = [],
      count = false,
      ...placeholders
    }: LuceneQueryOptions = {},
  ) {
    let _query;
    let _placeholders = placeholders;

    if (typeof query === 'object') {
      const res = CreateLucene(query);

      _query = res.querystring;
      _placeholders = {
        ...placeholders,
        ...res.placeholders,
      };
    } else {
      _query = query;
    }

    const body: {
      query: string;
      limit?: number;
      offset?: number;
      order?: string;
      fields?: string;
      count?: string;
      [index: string]: string | number | undefined;
    } = {
      query: _query,
      limit,
      offset,
      ..._placeholders,
    };

    if (count) {
      body.count = 'true'; // string true
    }

    if (order) {
      body.order = '' + order; // this implicitly does array.join(",") for arrays. (and works with strings...)
    }

    if (fields.length > 0) {
      body.fields = Array.isArray(fields) ? fields.join(',') : String(fields);
    }

    return this.request<T>({
      type: 'query',
      headers: { type: 'vertices' },
      body,
    });
  }

  ids<T>(list: string[]) {
    return this.request<T>({
      type: 'query',
      headers: { type: 'ids' },
      body: { query: list.join(',') }, // yes, it has to be a comma-seperated string
    });
  }

  /**
   *  This is a gremlin query
   */

  gremlin<T>(
    root: string,
    queryOrBuilder: GremlinQuery | GremlinQueryFunction,
  ) {
    const query =
      typeof queryOrBuilder === 'function'
        ? queryOrBuilder(CreateGremlin(''))
        : queryOrBuilder;

    return this.request<T>({
      type: 'query',
      headers: { type: 'gremlin' },
      body: { root, query: query.toString() },
    });
  }

  /**
   *  Connect two Nodes with an edge of `type`
   */
  connect<T>(type: string, inId: string, outId: string) {
    return this.request<T>({
      type: 'connect',
      headers: { 'ogit/_type': type },
      body: { in: inId, out: outId },
    }).pipe(
      catchError((err) => {
        if (Errors.isConflict(err)) {
          return EMPTY;
        }

        throw err;
      }),
      map(() => {}),
    );
  }

  /**
   *  Disconnect two nodes, convenience for delete, generates the edge id for you.
   */
  disconnect<T>(type: string, inId: string, outId: string) {
    return this.delete<T>(`${outId}$$${type}$$${inId}`).pipe(
      catchError((err) => {
        if (Errors.isNotFound(err) || Errors.isConflict(err)) {
          return EMPTY;
        }

        throw err;
      }),
      map(() => {}),
    );
  }

  /**
   *  Write timeseries values (only ogit/Timeseries vertices)
   *
   *  values are { timestamp: millisecond unix, value: string value }
   */
  writets<T>(
    timeseriesId: string,
    values: TimeseriesResponse | TimeseriesResponse[],
  ) {
    const items = Array.isArray(values) ? values : [values];

    return this.request<T>({
      type: 'writets',
      headers: {
        'ogit/_id': timeseriesId,
      },
      body: { items },
    });
  }

  /**
   *  Read timeseries values (only ogit/Timeseries vertices)
   */
  streamts<T>(
    timeseriesId: string,
    options: {
      from?: number | false;
      to?: number | false;
      limit?: number | false;
      includeDeleted?: boolean;
      with?: string[];
    } = {
      from: false,
      to: false,
      limit: 50,
      includeDeleted: false,
      with: [],
    },
  ) {
    const headers = {
      'ogit/_id': timeseriesId,
      ...options,
    };
    const body = {};

    return this.request<T>({
      type: 'streamts',
      headers,
      body,
    });
  }

  /**
   *  Returns previous versions of a vertex
   */
  history<T>(
    id: string,
    {
      listMeta = false,
      includeDeleted = false,
      ...options
    }: HistoryQueryOptions = {},
  ) {
    const headers: Record<string, any> = {
      'ogit/_id': id,
      listMeta,
      includeDeleted,
      ...options,
    };

    return this.request<T>({
      type: 'history',
      headers: headers,
      body: {},
    });
  }
}
