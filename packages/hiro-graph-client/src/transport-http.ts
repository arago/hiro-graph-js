/**
 *  The HTTP version of the transport.
 *  It support the `request` method,
 *  But translates them to `fetch` methods.
 */
import fetch from 'isomorphic-fetch';
import { ajax } from 'rxjs/ajax';
import { of } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';

import { AUTH_API_BASE, GRAPH_API_BASE } from './api-version';
import { RequestOptions, GraphRequest } from './types';

import { Token } from '.';

interface Response<T> {
  items?: T[] | null;
  error?: string | { message?: string };
}

const hasError = <T>(res: any): res is Response<T> => !!res.error;

export default class HttpTransport {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, ''); //remove trailing slash.
  }

  //this is basically window.fetch with a token.get() before it.
  fetch<T>(
    token: Token,
    url: string,
    options: RequestOptions = {},
    reqOptions: RequestOptions = {},
  ) {
    const _url = url.indexOf('http') === 0 ? url : this.endpoint + url;
    const tp =
      'token' in reqOptions ? Promise.resolve(reqOptions.token) : token.get();

    return of(tp)
      .pipe(
        mergeMap((t) => t),
        mergeMap(async (t) => {
          const headers = {
            ...(options.headers || {}),
            ...(reqOptions.headers || {}),
            Authorization: 'Bearer ' + t,
          };

          const res = await fetch(_url, {
            ...options,
            body: JSON.stringify(options.body),
            headers,
          });

          return res.json();
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
  request(
    token: Token,
    { type, headers = {}, body = {} }: GraphRequest,
    reqOptions: RequestOptions = {},
  ) {
    const [url, options] = createFetchOptions({ type, headers, body });

    return this.fetch(token, url, options, reqOptions);
  }

  defaultOptions() {
    return defaultFetchOptions();
  }
}

//exported for use in the connection
export const defaultFetchOptions = (): RequestOptions => ({
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  mode: 'cors',
});

//here are the mappings to fetch options from the websocket payloads.
function createFetchOptions({
  type,
  headers = {},
  body = {},
}: GraphRequest): [string, RequestOptions] {
  let url;
  const options = defaultFetchOptions();

  switch (type) {
    case 'getme':
      url = `${AUTH_API_BASE}/me/account?profile=true`;
      break;
    case 'get':
      url = `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}`;
      break;
    case 'create':
      url =
        `${GRAPH_API_BASE}/new/` +
        encodeURIComponent(headers['ogit/_type']) +
        qsKeys(headers, 'waitForIndex');
      sendJSON(options, body);
      break;
    case 'update':
      url =
        `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}` +
        qsKeys(headers, 'waitForIndex');
      sendJSON(options, body);
      break;
    case 'replace':
      const t = headers.createIfNotExists ? headers['ogit/_type'] : undefined;
      const obj = Object.assign({ 'ogit/_type': t }, headers);

      url =
        `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}` +
        qsKeys(obj, 'createIfNotExists', 'ogit/_type', 'waitForIndex');
      sendJSON(options, body, 'PUT');
      break;
    case 'delete':
      url = `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}`;
      options.method = 'DELETE';
      break;
    case 'connect':
      url = `${GRAPH_API_BASE}/connect/${encodeURIComponent(
        headers['ogit/_type'],
      )}`;
      sendJSON(options, body);
      break;
    case 'query':
      url = `${GRAPH_API_BASE}/query/` + headers.type;
      sendJSON(options, body);
      break;
    case 'streamts':
      url =
        `${GRAPH_API_BASE}/` +
        encodeURIComponent(headers['ogit/_id']) +
        '/values' +
        qsKeys(
          headers,
          'offset',
          'limit',
          'from',
          'to',
          'includeDeleted',
          'with',
        );
      break;
    case 'writets':
      url =
        `${GRAPH_API_BASE}/` +
        encodeURIComponent(headers['ogit/_id']) +
        '/values';
      sendJSON(options, body);
      break;
    case 'history':
      url =
        `${GRAPH_API_BASE}/` +
        encodeURIComponent(headers['ogit/_id']) +
        '/history' +
        qsKeys(
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
        );
      break;
    case 'meta':
      url =
        `${GRAPH_API_BASE}/` +
        encodeURIComponent(headers['ogit/_id']) +
        '/meta';
      break;
    default:
      throw new Error(`[HTTP] Unknown API call: ${type}`);
  }

  return [url, options];
}

function qsKeys(obj: Record<string, string> = {}, ...keys: string[]) {
  const qs = keys
    .map((k) => {
      if (k in obj && obj[k] !== undefined) {
        return `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`;
      }

      return false;
    })
    .filter(Boolean)
    .join('&');

  return qs.length ? '?' + qs : '';
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
