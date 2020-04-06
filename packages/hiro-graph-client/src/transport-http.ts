/**
 *  The HTTP version of the transport.
 *  It support the `request` method,
 *  But translates them to `fetch` methods.
 */
import fetch from 'isomorphic-fetch';
import { of } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';

import { GraphRequest, GraphTransport } from './types';
import { Endpoint } from './endpoint';
import { extract } from './utils';
import { RequestOptions } from './types';

import { Token } from '.';

interface Response<T> {
  items?: T[] | null;
  error?: string | { message?: string };
}

const hasError = <T>(res: any): res is Response<T> => !!res.error;

export class HttpTransport implements GraphTransport {
  private endpoint: Endpoint;

  constructor(endpoint: string) {
    this.endpoint = new Endpoint(endpoint);
  }

  //this is basically window.fetch with a token.get() before it.
  private fetch<T>(token: Token, url: string, options: RequestOptions = {}) {
    const tp = token.get();

    return of(tp)
      .pipe(
        mergeMap((t) => t),
        mergeMap(async (t) => {
          const headers = {
            ...(options.headers || {}),
            Authorization: 'Bearer ' + t,
          };

          let req = {
            ...options,
            headers,
          };

          if (options.body) {
            req.body = JSON.stringify(options.body);
          }

          const res = await fetch(url, req);

          return res.json().catch(() => {
            if (res.status === 202) {
              // Special case when there is potentially no body
              return {};
            }

            throw new Error('Invalid JSON in response from Graph');
          });
        }),
      )
      .pipe(
        catchError((err) =>
          of({
            error: {
              message: err.reason || err.message,
              code: err.code || 500,
            },
          }),
        ),
        map((res) => {
          if (hasError<T>(res)) {
            throw res.error;
          }

          return (res as Response<T>).items || [];
        }),
      );
  }

  //request has to translate the base request objects to fetch.
  request<T = any>(
    token: Token,
    { type, headers = {}, body = {} }: GraphRequest,
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
const defaultFetchOptions = (): RequestOptions => ({
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
  { type, headers = {}, body = {} }: GraphRequest,
): [string, RequestOptions] {
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
        `/new/${encodeURIComponent(headers['ogit/_type'])}`,
        extract(headers, 'waitForIndex'),
      );
      sendJSON(options, body);
      break;
    case 'update':
      url = endpoint.api(
        'graph',
        `${encodeURIComponent(headers['ogit/_id'])}`,
        extract(headers, 'waitForIndex'),
      );

      sendJSON(options, body);
      break;
    case 'replace':
      const t = headers.createIfNotExists ? headers['ogit/_type'] : undefined;
      const query = {
        'ogit/_type': t,
        ...extract(headers, 'createIfNotExists', 'waitForIndex'),
      };

      url = endpoint.api(
        'graph',
        `${encodeURIComponent(headers['ogit/_id'])}`,
        query,
      );

      sendJSON(options, body, 'PUT');
      break;
    case 'delete':
      url = endpoint.api('graph', `${encodeURIComponent(headers['ogit/_id'])}`);
      options.method = 'DELETE';
      break;
    case 'connect':
      url = endpoint.api(
        'graph',
        `/connect/${encodeURIComponent(headers['ogit/_type'])}`,
      );

      sendJSON(options, body);
      break;
    case 'query':
      url = endpoint.api('graph', `/query/${headers.type}`);

      sendJSON(options, body);
      break;
    case 'streamts':
      url = endpoint.api(
        'graph',
        `/${encodeURIComponent(headers['ogit/_id'])}/values`,
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
      url = endpoint.api(
        'graph',
        `/${encodeURIComponent(headers['ogit/_id'])}/values`,
      );

      sendJSON(options, body);
      break;
    case 'history':
      url = endpoint.api(
        'graph',
        `/${encodeURIComponent(headers['ogit/_id'])}/history`,
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
      url = endpoint.api(
        'graph',
        `/${encodeURIComponent(headers['ogit/_id'])}/meta`,
      );

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
  options.body = body;

  return options;
}
