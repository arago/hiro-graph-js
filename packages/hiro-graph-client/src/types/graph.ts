export type GraphEndpoint =
  | 'connect'
  | 'create'
  | 'delete'
  | 'get'
  | 'getme'
  | 'history'
  | 'meta'
  | 'query'
  | 'replace'
  | 'streamts'
  | 'update'
  | 'token'
  | 'writets';

export declare namespace GraphRequest {
  interface Base {
    type: GraphEndpoint;
    headers?: any; // @todo
    body?: any; // @todo
  }

  export interface Connect extends Base {
    type: 'connect';
    headers: {
      'ogit/_type': string;
    };
  }
  export interface Create extends Base {
    type: 'create';
    headers: {
      'ogit/_type': string;
      waitForIndex?: 'true';
    };
  }
  export interface Delete extends Base {
    type: 'delete';
    headers: {
      'ogit/_id': string;
      waitForIndex?: 'true';
    };
  }
  export interface Get extends Base {
    type: 'get';
    headers: {
      'ogit/_id': string;
    };
  }
  export interface GetMe extends Base {
    type: 'getme';
  }
  export interface History extends Base {
    type: 'history';
    headers: {
      'ogit/_id': string;
      offset?: number;
      limit?: number;
      from?: number;
      to?: number;
      version?: number;
      type?: string;
      listMeta?: boolean;
      includeDeleted?: boolean;
      vid?: string;
    };
  }
  export interface Meta extends Base {
    type: 'meta';
  }
  export interface Query extends Base {
    type: 'query';
    headers: {
      type: 'vertices' | 'gremlin' | 'ids';
    };
  }
  export interface Replace extends Base {
    type: 'replace';
    headers: {
      'ogit/_id': string;
      waitForIndex?: 'true';

      // ogit/_type is required if createIfNotExists is used
      'ogit/_type'?: string;
      createIfNotExists?: 'true';
    };
  }
  export interface Streamts extends Base {
    type: 'streamts';
    headers: {
      'ogit/_id': string;
      from?: number | false;
      to?: number | false;
      limit?: number | false;
      includeDeleted?: boolean;
      with?: string[];
    };
  }
  export interface Update extends Base {
    type: 'update';
    headers: {
      'ogit/_id': string;
      waitForIndex?: 'true';
    };
  }
  export interface Writets extends Base {
    type: 'writets';
    headers: {
      'ogit/_id': string;
    };
  }
  export interface Token extends Base {
    type: 'token';
    args: {
      _TOKEN: string;
    };
  }
}

export type GraphRequestType =
  | GraphRequest.Connect
  | GraphRequest.Token
  | GraphRequest.Create
  | GraphRequest.Delete
  | GraphRequest.Get
  | GraphRequest.GetMe
  | GraphRequest.History
  | GraphRequest.Meta
  | GraphRequest.Query
  | GraphRequest.Replace
  | GraphRequest.Streamts
  | GraphRequest.Update
  | GraphRequest.Writets;

interface RequestOptionsBase extends globalThis.RequestInit {
  raw?: boolean;
  json?: object;
}

export interface RequestOptionsRaw extends RequestOptionsBase {
  raw: true;
}

export interface RequestOptionsDefault extends RequestOptionsBase {
  raw?: false;
}

export type RequestOptions = RequestOptionsDefault | RequestOptionsRaw;

export interface GraphTransport {
  request: <T = any>(
    token: any,
    request: GraphRequestType,
  ) => import('rxjs').Observable<T>;
}
