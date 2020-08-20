export const APIs = {
  http: {
    app: '/api/app/7.0',
    auth: '/api/auth/6.1',
    graph: '/api/graph/7.1',
    iam: '/api/iam/6.1',
    ki: '/api/ki/6',
    variables: '/api/variables/6',
  },
  ws: {
    events: '/api/events-ws/6.1',
    graph: '/api/graph-ws/6.1',
  },
};

export type WS_API = keyof typeof APIs['ws'];
export type HTTP_API = keyof typeof APIs['http'];

export class Endpoint<
  WS extends boolean = false,
  TExtraAPIs extends Record<string, string> | undefined = {}
> {
  private _value: string;
  private _api?: (WS extends true ? WS_API : HTTP_API) | keyof TExtraAPIs;
  protected readonly APIs?: Record<string, string>;

  constructor(value: string, isWebsocket?: WS, extraAPIs?: TExtraAPIs) {
    this._value = value.replace(/\/$/, '');

    if (isWebsocket) {
      this._value = this._value.replace(/^http/, 'ws');
      this.APIs = { ...APIs.ws, ...extraAPIs };
    } else {
      this.APIs = { ...APIs.http, ...extraAPIs };
    }
  }

  get value() {
    return this._value;
  }

  get currentApi() {
    if (!this.APIs) {
      throw new Error(`No APIs defined for this endpoint: ${this._value}`);
    }

    if (this._api) {
      // @ts-ignore
      return this.APIs[this._api];
    }

    return '';
  }

  use(name: (WS extends true ? WS_API : HTTP_API) | keyof TExtraAPIs) {
    // @ts-ignore
    this._api = name;

    return this;
  }

  path(path?: string | string[], query?: Record<string, any>) {
    let url = this._value + this.currentApi;

    if (path) {
      let _path = Array.isArray(path) ? path.join('/') : path;

      if (path.indexOf('http') === 0) {
        url = _path;
      } else {
        let p = _path.replace(/\/$/, '');

        if (!p.startsWith('/')) {
          p = `/${p}`;
        }

        url += p;
      }
    }

    if (query) {
      url += stringify(query);
    }

    return url;
  }

  api(
    name: (WS extends true ? WS_API : HTTP_API) | keyof TExtraAPIs,
    path?: string | string[],
    query?: Record<string, any>,
  ) {
    return this.use(name).path(path, query);
  }
}

export function stringify(obj: Record<string, any>) {
  const qs = Object.keys(obj)
    .map((k) => {
      if (obj[k] !== undefined && obj[k] !== null) {
        return `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`;
      }

      return false;
    })
    .filter(Boolean)
    .join('&');

  return qs.length > 0 ? '?' + qs : '';
}
