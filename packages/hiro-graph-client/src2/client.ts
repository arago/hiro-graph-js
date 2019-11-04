import fetch from 'isomorphic-fetch';

import { HttpTransport } from './transports';
import { GraphClient, POJO, RequestType, Token, Transport } from './types';

function getDefaultApi() {
  return {};
}

export class Client implements GraphClient {
  public http: Transport;
  public ws: Transport;
  public apiVersionInfo: POJO = {};
  private transport: Transport;

  constructor(
    private token: Token,
    private readonly endpoint: string,
    private readonly transportOptions?: POJO,
  ) {
    this.apiVersionInfo = getDefaultApi();
    this.ws = new HttpTransport(
      this.endpoint,
      this.apiVersionInfo['graph']['version'],
      this.apiVersionInfo['graph']['endpoint'],
    );
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

  gremlin<T>(root: string, query: string): Promise<T> {
    return this.request('query', { type: query }, { root, query }) as Promise<
      T
    >;
  }

  setToken(token: Token) {
    this.token = token;
  }

  introspect() {}

  dedupedRequest() {}

  getToken() {
    return this.token;
  }

  get<T>(id: string): Promise<T> {
    return this.request('get', { 'ogit/_id': id }) as Promise<T>;
  }

  me<T>(): Promise<T> {
    return this.request('getme', {}) as Promise<T>;
  }

  create<T>(type: string, data: POJO = {}): Promise<T> {
    return this.request('create', { 'ogit/_type': type }, data) as Promise<T>;
  }

  update<T>(id: string, data: POJO = {}): Promise<T> {
    return this.request('update', { 'ogit/_id': id }, data) as Promise<T>;
  }

  delete<T>(id: string): Promise<T> {
    return this.request('delete', {}) as Promise<T>;
  }

  ids<T>(ids: string[]): Promise<T[]> {
    const query = ids.map((id) => `(ogit/_id: "${id}")`).join(' OR ');

    return this.lucene(query) as Promise<T[]>;
  }

  connect<T>(outId: string, type: string, inId: string): Promise<T> {
    return this.request(
      'connect',
      { 'ogit/_type': type },
      { out: outId, in: inId },
    ) as Promise<T>;
  }

  // TODO: need to make upsert as well
  replace<T>(id: string, data: POJO): Promise<T> {
    return this.request('replace', {}, data) as Promise<T>;
  }
}
