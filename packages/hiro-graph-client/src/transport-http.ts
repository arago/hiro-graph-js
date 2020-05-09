/**
 *  The HTTP version of the transport.
 *  It support the `request` method,
 *  But translates them to `fetch` methods.
 */
import * as f from 'isomorphic-fetch';
import { of, Observable } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';

import { GraphTransport, GraphRequestType } from './types';
import { Endpoint } from './endpoint';
import { extract } from './utils';
import {
  RequestOptions,
  RequestOptionsRaw,
  RequestOptionsDefault,
} from './types';
import * as Errors from './errors';
import { Token } from './token';

// @ts-ignore - Try to make all build types happy
const fetch = f.default;

interface Response<T> {
  items?: T[] | null;
  error?: string | Errors.ClientError;
}

export type FetchReturnType<T, O extends RequestOptions> = O['raw'] extends true
  ? Observable<globalThis.Response>
  : Observable<T | T[]>;

const hasRaw = (options: RequestOptions): options is RequestOptionsRaw =>
  options.raw === true;
const hasError = <T>(res: any): res is Required<Response<T>> => !!res.error;

const filterUndef = (obj: any) =>
  Object.keys(obj).reduce((ret, k) => {
    if (obj[k] !== undefined) {
      ret[k] = obj[k];
    }

    return ret;
  }, {} as any);

export class HttpTransport implements GraphTransport {
  private endpoint: Endpoint;

  constructor(endpoint: string) {
    this.endpoint = new Endpoint(endpoint);
  }

  //this is basically window.fetch with a token.get() before it.
  fetch<T, O extends RequestOptions = RequestOptions>(
    token: Token,
    url: string,
    // @ts-ignore - We have plenty of safety here...
    options: O = {},
  ): FetchReturnType<T, O> {
    const tp = token.get();

    const fetch$ = of(tp).pipe(
      mergeMap((t) => t),
      mergeMap(async (t) => {
        const headers = {
          ...(options.headers || {}),
          Authorization: 'Bearer ' + t,
        };

        const { json, ...rest } = options;

        let req = {
          ...rest,
          headers,
        };

        if (json) {
          req.body = JSON.stringify(filterUndef(json));
        }

        return fetch(url, req);
      }),
    );

    if (hasRaw(options)) {
      return fetch$ as FetchReturnType<T, O>;
    }

    return fetch$
      .pipe(
        mergeMap((res) => {
          return res.json().catch(() => {
            if (res.status === 202) {
              // Special case when there is potentially no body
              return {};
            }

            return {
              error: Errors.create(502, 'Invalid JSON in response from Graph'),
            };
          });
        }),
      )
      .pipe(
        catchError((err) =>
          of({
            error: Errors.create(err.code || 500, err.reason || err.message),
          }),
        ),
        map((res: any): T | T[] => {
          if (hasError<T>(res)) {
            let msg = 'Unknown GraphIT Error';
            let code = 500;

            if (typeof res.error === 'string') {
              msg = res.error;
            } else if (typeof res.error === 'object') {
              msg = res.error.message || msg;
              code = res.error.code || code;
            }

            throw Errors.create(code, `[HTTP] Error: ${msg}`);
          }

          if ('items' in res) {
            return res.items;
          }

          return res || {};
        }),
      ) as FetchReturnType<T, O>;
  }

  //request has to translate the base request objects to fetch.
  request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: GraphRequestType,
  ) {
    const [url, options] = createFetchOptions(this.endpoint, {
      type,
      headers,
      body,
    });

    return this.fetch<T>(token, url, options);
  }

  getDefaultOptions() {
    return defaultFetchOptions();
  }
}

//exported for use in the connection
const defaultFetchOptions = (): RequestOptionsDefault => ({
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  mode: 'cors',
});

//here are the mappings to fetch options from the websocket payloads.
function createFetchOptions(
  endpoint: Endpoint,
  { type, headers = {}, body = {} }: GraphRequestType,
): [string, RequestOptionsDefault] {
  let url;
  const options = defaultFetchOptions();

  switch (type) {
    case 'getme':
      url = endpoint.api('auth', '/me/account', { profile: true });
      break;
    case 'get':
      url = endpoint.api('graph', encodeURIComponent(headers['ogit/_id']));
      break;
    case 'create':
      url = endpoint.api(
        'graph',
        ['new', encodeURIComponent(headers['ogit/_type'])],
        extract(headers, 'waitForIndex'),
      );
      sendJSON(options, body);
      break;
    case 'update':
      url = endpoint.api(
        'graph',
        encodeURIComponent(headers['ogit/_id']),
        extract(headers, 'waitForIndex'),
      );

      sendJSON(options, body);
      break;
    case 'replace':
      const t = headers.createIfNotExists ? headers['ogit/_type'] : undefined;
      const query = {
        ...extract(headers, 'createIfNotExists', 'waitForIndex'),
        'ogit/_type': t,
      };

      url = endpoint.api(
        'graph',
        `${encodeURIComponent(headers['ogit/_id'])}`,
        query,
      );

      sendJSON(options, body, 'PUT');
      break;
    case 'delete':
      url = endpoint.api('graph', encodeURIComponent(headers['ogit/_id']));
      options.method = 'DELETE';
      break;
    case 'connect':
      url = endpoint.api('graph', [
        'connect',
        encodeURIComponent(headers['ogit/_type']),
      ]);

      sendJSON(options, body);
      break;
    case 'query':
      url = endpoint.api('graph', ['query', headers.type]);

      sendJSON(options, body);
      break;
    case 'streamts':
      url = endpoint.api(
        'graph',
        [encodeURIComponent(headers['ogit/_id']), 'values'],
        extract(
          headers,
          'offset',
          'limit',
          'from',
          'to',
          'includeDeleted',
          'with',
        ),
      );

      break;
    case 'writets':
      url = endpoint.api('graph', [
        encodeURIComponent(headers['ogit/_id']),
        'values',
      ]);

      sendJSON(options, body);
      break;
    case 'history':
      url = endpoint.api(
        'graph',
        [encodeURIComponent(headers['ogit/_id']), 'history'],
        extract(
          headers,
          'offset',
          'limit',
          'from',
          'to',
          'version',
          'type',
          'includeDeleted',
          'listMeta',
          'vid',
        ),
      );

      break;
    case 'meta':
      url = endpoint.api('graph', [
        encodeURIComponent(headers['ogit/_id']),
        'meta',
      ]);

      break;
    default:
      throw new Error(`[HTTP] Unknown API call: ${type}`);
  }

  return [url, options];
}

function sendJSON(
  options: RequestOptions,
  body: any,
  method: RequestOptions['method'] = 'POST',
) {
  options.method = method;
  options.json = body;

  return options;
}
