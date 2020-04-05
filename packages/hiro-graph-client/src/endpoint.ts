import qs, { ParsedUrlQueryInput } from 'querystring';

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

export class Endpoint<WS extends boolean = false> {
  private _value: string;
  protected readonly APIs?: Record<string, string>;

  constructor(value: string, isWebsocket?: WS) {
    this._value = value.replace(/\/$/, '');

    if (isWebsocket) {
      this._value = this._value.replace(/^http/, 'ws');
      this.APIs = APIs.ws;
    } else {
      this.APIs = APIs.http;
    }
  }

  get value() {
    return this._value;
  }

  api(
    name: WS extends true ? WS_API : HTTP_API,
    path?: string,
    query?: ParsedUrlQueryInput,
  ) {
    if (!this.APIs) {
      throw new Error(`No APIs defined for this endpoint: ${this.value}`);
    }

    let url = this._value + this.APIs[name];

    if (path) {
      if (path.indexOf('http') === 0) {
        url = path;
      } else {
        let p = path.replace(/\/$/, '');

        if (!p.startsWith('/')) {
          p = `/${p}`;
        }

        url += p;
      }
    }

    if (query && Object.keys(query).length > 0) {
      url += `/?${qs.stringify(query)}`;
    }

    return url;
  }
}
