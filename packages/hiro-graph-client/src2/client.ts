import fetch from 'isomorphic-fetch';

import { HttpTransport } from './transports';
import { GraphClient, POJO, RequestType, Token, Transport } from './types';

function getDefaultApi() {
  return {};
}

export class Client implements GraphClient {
  private http: Transport;
  public apiVersionInfo: POJO = {};
  private transport: Transport;

  constructor(
    private readonly token: Token,
    private readonly endpoint: string,
    private readonly transportOptions?: POJO,
  ) {
    this.apiVersionInfo = getDefaultApi();
    this.http = new HttpTransport(
      this.endpoint,
      this.apiVersionInfo['graph']['version'],
      this.apiVersionInfo['graph']['endpoint'],
    );
    this.transport = this.http;
  }

  async setup() {
    const response = await fetch(`${this.endpoint}/api/version`);

    if (response.ok) {
      this.apiVersionInfo = await response.json();
    }

    this.http = new HttpTransport(
      this.endpoint,
      this.apiVersionInfo['graph']['version'],
      this.apiVersionInfo['graph']['endpoint'],
    );
  }

  private request<T>(
    type: RequestType,
    headers: POJO,
    body?: POJO,
  ): Promise<T | Response> {
    return this.transport
      .request<T>(this.token, type, { headers, body })
      .catch((err) => {
        if (err.code === 401) {
          this.token.invalidate();
        }

        throw err;
      });
  }

  lucene<T>(
    query: string = '',
    {
      limit = 50,
      offset = 0,
      order = false,
      fields = [],
      count = false,
      ...placeholders
    } = {},
  ): Promise<T[]> {
    const body = {
      query,
      limit,
      offset,
      count: Boolean(count),
      order: '' + order, // this implicitly does array.join(",") for arrays. (and works with strings...)
      fields: Array.isArray(fields) ? fields.join(',') : String(fields),
      ...placeholders,
    };

    return this.request('query', { type: 'vertices' }, body) as Promise<T[]>;
  }

  setToken() {}

  eventStream() {}

  introspect() {}

  dedupedRequest() {}

  getToken() {
    return this.token;
  }

  get(id: string) {
    return this.request('get', { 'ogit/_id': id })
  }

  me() {}

  create() {}

  update() {}

  replace() {}

  delete() {}


  ids() {}

  gremlin() {}

  connect() {}
}
