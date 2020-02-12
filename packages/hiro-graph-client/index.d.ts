// Data

import { Response, HeaderInit } from 'node-fetch';
import { w3cwebsocket } from 'websocket';

export namespace OGIT {
  export interface SafeNode {
    'ogit/_id': string;
    'ogit/_type': string;
    'ogit/_modified-on': number;
    'ogit/_modified-by': string;
    'ogit/_creator': string;
    'ogit/_created-on': number;
    'ogit/_is-deleted': boolean;
    'ogit/_graphtype': string;
    'ogit/_xid': string;
  }

  export interface Node extends SafeNode {
    [key: string]: string | number | boolean;
  }

  export interface Issue extends SafeNode {
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/subject'?: string;
    'ogit/status'?: string;
    'ogit/Automation/processingNode'?: string;
    'ogit/Automation/originNode'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
  }

  export interface Session extends SafeNode {
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/title'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
    '/teaching_issue_subject'?: string;
    '/teaching_is_handedover'?: string;
    '/teaching_step_progress'?: string;
    '/teaching_ki_progress'?: string;
    '/teaching_ownerId'?: string;
    '/teaching_conversion_ownerId'?: string;
    '/teaching_rooms'?: string;
    '/teaching_rooms_completed'?: string;
    '/teaching_steps'?: string;
    '/teaching_steps_deployed'?: string;
    'ogit/Knowledge/archived'?: string;
  }

  export interface KnowledgeItem extends SafeNode {
    'ogit/Automation/knowledgeItemFormalRepresentation': string;
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/description'?: string;
    'ogit/isValid'?: string;
    'ogit/name'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
  }

  export interface KnowledgePool extends SafeNode {
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/name'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
  }

  export interface Account extends SafeNode {
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/name'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
    'ogit/status'?: string;
    'ogit/email'?: string;
  }

  export interface AccountProfile extends SafeNode {
    'ogit/_creator-app'?: string;
    'ogit/_modified-by-app'?: string;
    'ogit/_owner'?: string;
    'ogit/_v'?: number;
    'ogit/_v-id'?: string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
    'ogit/Auth/Account/acceptedEmails'?: string; // timestamp
    'ogit/Auth/Account/displayName'?: string;
    'ogit/firstName'?: string;
    'ogit/lastName'?: string;
    '/jobRole'?: string;
    '/profileSet'?: string;
  }

  export interface Edge extends SafeNode {
    'ogit/_edge-id': string;
    'ogit/_in-type': string;
    'ogit/_out-id': string;
    'ogit/_out-type': string;
    'ogit/_in-id': string;
  }

  export interface Application extends SafeNode {
    'ogit/name': string;
    'ogit/description': string;
    'ogit/Auth/vertexRule': string;
    'ogit/Auth/edgeRule': string;
  }

  export interface Role extends SafeNode {
    'ogit/name': string;
    'ogit/description'?: string;
    'ogit/Auth/vertexRule': string;
    'ogit/Auth/edgeRule': string;
  }

  export interface Team extends SafeNode {
    'ogit/name': string;
    'ogit/description'?: string;
  }

  export interface DataScope extends SafeNode {
    'ogit/name': string;
    'ogit/description'?: string;
  }
}

export interface AccountWithProfile {
  account: OGIT.Account;
  avatar: string;
  profile: OGIT.AccountProfile;
}

export interface NodeHistory<T extends OGIT.SafeNode = OGIT.Node> {
  action: string;
  identity: string;
  data: T;
  meta: {
    id: string;
    nanotime: number;
    timestamp: number;
    version: number;
    vid: string;
  };
}

// HttpTransport

interface RequestParams {
  type: string;
  headers?: object;
  body?: object;
}

interface EmitMessage {
  name: string;
  data?: any;
}

interface Subscriber<T> {
  next?: (value?: T) => void;
  error?: (err?: any) => void;
  complete?: () => void;
}

interface DefaultFetchOptions {
  mode: string;
  method: string;
  headers: HeaderInit;
}

interface ReqOptions<T = any> {
  waitForIndex?: boolean;
  headers?: object;
  token?: string;
  emit?: (message: EmitMessage) => void;
  sub?: Subscriber<T>;
}

type RequestInit = import('node-fetch').RequestInit & { raw?: boolean };

declare class HttpTransport {
  endpoint: string;
  constructor(endpoint: string);
  fetch(
    token: string,
    url: string,
    init?: RequestInit,
    reqOptions?: ReqOptions,
  ): Promise<Response>;
  request(
    token: string,
    params?: RequestParams,
    reqOptions?: ReqOptions,
  ): Promise<Response>;
  defaultFetchOptions(): DefaultFetchOptions;
}

// WebSocketTransport

type EmitHandler = (message: EmitMessage) => void;

declare class WebSocketTransport {
  endpoint: string;
  useLegacyProtocol: boolean;
  constructor(endpoint: string);
  request(
    token: string,
    params?: RequestParams,
    reqOptions?: object,
  ): Promise<w3cwebsocket>;
  connect(token: string, emit: EmitHandler): Promise<w3cwebsocket>;
  createWebSocket(
    initialToken: string,
    emit: EmitHandler,
  ): Promise<w3cwebsocket>;
  defaultFetchOptions(): {
    method: 'GET';
    headers: {
      'Content-Type': 'application/json';
      Accept: 'application/json';
    };
    mode: 'cors';
  };
}

// EventStream

interface EventStreamOptions {
  groupId?: number;
  offset?: number;
}

declare interface HiroEvent<T = any> {
  id: string;
  identity: string;
  type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'WRITETIMESERIES';
  timestamp: number;
  nanotime: number;
  body: T;
}

type EventUnsubscribe = () => void;

type EventHandler = <T = any>(event: HiroEvent<T>) => void;

declare class EventStream {
  constructor(
    clientParams: ClientParams,
    options?: EventStreamOptions & { filters?: string[] },
    emit?: (message: EmitMessage) => void,
  );

  subscribe: <T = any>(handler: EventHandler) => EventUnsubscribe;
  register: (filter: string) => void;
  unregister: (filter: string) => void;
}

// Timeseries

export namespace TimeSeries {
  export interface Value<VariableNames extends string = string> {
    Entries: Entry[];
    Type: 'start' | 'execute' | 'move' | 'finish';

    Alternatives?: Alternatives;
    Changes?: Change<VariableNames>[];
    ContextHash?: string;
    Count?: number;
    Fingerprints?: Fingerprints;
    IssueVersion?: string;
    KIID?: string;
    KIVersion?: string;
    NodeID?: string;
    NodeVersion?: string;
    Stats?: Stats;

    [index: string]: any;
  }

  export interface Alternatives {
    [index: string]: string;
  }

  export interface ChangeValue {
    created: number;
    created_on: string;
    implicit: boolean;
    key: string;
    value: any;
  }

  export type ChangeVariables<VariableNames extends string = string> = {
    [key in VariableNames]: ChangeValue;
  };

  export interface ChangeMeta {
    Action: 'add' | 'delete';
    NodeID: string;
  }

  export type Change<VariableNames extends string = string> = ChangeMeta &
    ChangeVariables<VariableNames>;

  export interface Entry {
    LogLevel: string;
    Message: string;

    Command?: string;
    TimeStamp?: number;
  }

  export interface Fingerprints {
    [index: string]: string;
  }

  export interface Stats {
    backoffs?: number;
    bind_node?: number;
    commit_time?: number;
    ctxs?: number;
    exec_time?: number;
    kis?: number;
    match_time?: number;
    overall?: number;
    route_time?: number;
    routed?: number;
  }
}

export interface TimeseriesObject {
  timestamp: number;
  value: TimeSeries.Value;
}

export interface TimeseriesResponse {
  timestamp: number;
  value: string;
}

// Servlets

interface PlainObject {
  [key: string]: any;
}

export type LegacyServletFunction = (
  // TODO: fix fetch type
  fetch: any,
  options: PlainObject,
  ...args: any[]
) => any;

export interface LegacyServletDefinition {
  [key: string]: LegacyServletFunction;
}

export type ServletFactory = () => PlainObject;

export type ServletMethods = LegacyServletDefinition | ServletFactory;

export interface AppsServlet {
  getAll<T = OGIT.Application>(): Promise<T[]>;

  getMy<T = OGIT.Application>(): Promise<T[]>;

  install<T = any>(id: string): Promise<T>;

  uninstall<T = any>(id: string): Promise<T>;
}

interface KiValidateOptions {
  ki: string;
  [key: string]: any;
}

interface KiValidationResponse {
  valid: boolean;
  response:
    | string
    | {
        code: number;
        status: string;
        error?: string;
        formatted?: string;
        variables?: {
          ISSUE: string[];
          NODE: string[];
        };
        errors?: { line: number; message: string }[];
      };
}

export interface KiServlet {
  validate(options: KiValidateOptions): Promise<KiValidationResponse>;
}

interface DefineVariableOptions {
  name: string;
  [key: string]: any;
}

export interface VariablesServlet {
  // TODO: define Variable interface
  add<T = any>(data: any): Promise<T>;

  suggest<T = any>(name: string, full: boolean, ...args: any[]): Promise<T>;

  define<T = any>(options: DefineVariableOptions): Promise<T>;
}

export interface ApiServlet {
  getMeProfile<T = any>(): Promise<T>;

  updateMeProfile<T = any>(data: PlainObject): Promise<T>;

  getMeAvatar(): Promise<Response>;

  meAccount<T = any>(): Promise<T>;

  mePassword<T = any>(oldPassword: string, newPassword: string): Promise<T>;

  meTeams<T = any>(): Promise<T[]>;

  updateMeAvatar<T = any>(): Promise<T>;
}

export interface AuthServlet {
  getAvatar(id: string): Promise<Response>;

  getOrgAvatar(id: string): Promise<Response>;

  getAccount(id: string): Promise<AccountWithProfile>;

  getAccountProfile(id: string): Promise<OGIT.AccountProfile>;

  getAccountProfileByAccountId(accountId: string): Promise<OGIT.AccountProfile>;

  getTeam<T = any>(id: string): Promise<T>;

  getTeamMembers<T = any>(id: string): Promise<T[]>;

  getOrganizationMembers<T = any>(id: string): Promise<T[]>;

  organizationTeams<T = any>(id: string, virtual?: boolean): Promise<T[]>;

  accountTeams<T = any>(id: string): Promise<T[]>;

  organizationDomains<T = any>(id: string): Promise<T>;

  organizationRoleAssignments<T = any>(id: string): Promise<T[]>;

  getDomainOrganization<T = any>(id: string): Promise<T>;

  getDataScope<T = any>(id: string): Promise<T>;

  organizationScopes<T = any>(id: string): Promise<T[]>;

  organizationDataSets<T = any>(id: string): Promise<T[]>;

  listAllRoles<T = any>(): Promise<T[]>;

  listRoles<T = any>(offset: number, limit: number, name: string): Promise<T[]>;

  revoke<T = any>(clientId: string): Promise<T>;
}

export declare const appsServletFactory: () => AppsServlet;
export declare const kiServletFactory: () => KiServlet;
export declare const variablesSerlvetFactory: () => VariablesServlet;

// Client

export class Token {
  constructor({
    onInvalidate,
    getMeta,
    getToken,
  }: {
    onInvalidate?: () => object;
    getMeta?: () => object;
    getToken: () => object;
  });
  get: () => Promise<string>;
}

interface ClientParams {
  endpoint: string;
  token: string | Token;
}

interface BaseOptions {
  offset?: number;
  limit?: number;
}

export default class Client {
  endpoint: string;
  token: Token;
  http: HttpTransport;
  transport: WebSocketTransport | HttpTransport;

  // added in constructor
  auth: AuthServlet;
  api: ApiServlet;

  constructor(
    params: ClientParams,
    transportOptions?: object,
    proxies?: string[],
  );

  private _pubsub: {
    subscribe: (emit: EmitHandler) => void;
  };

  setToken(token: string | Token): void;

  eventStream(filters?: string[], options?: EventStreamOptions): EventStream;

  getToken<T extends Token = Token>(): T;

  me(): Promise<AccountWithProfile>;

  fetch: <T = Response>(
    url: string,
    init?: RequestInit,
    reqOptions?: ReqOptions<T>,
  ) => Promise<T>;

  gremlin: <T>(
    root: string,
    query: string,
    reqOptions?: ReqOptions<T>,
  ) => Promise<T>;

  connect: <T extends OGIT.SafeNode = OGIT.Node>(
    type: string,
    inId: string,
    outId: string,
    reqOptions?: ReqOptions<T>,
  ) => Promise<T>;

  disconnect: <T extends OGIT.SafeNode = OGIT.Node>(
    type: string,
    inId: string,
    outId: string,
    reqOptions?: ReqOptions<T>,
  ) => Promise<T>;

  lucene: <T>(
    query: string,
    options?: BaseOptions & {
      order?: string;
      fields?: string[];
      count?: boolean;
      [index: string]: any;
    },
    reqOptions?: ReqOptions<T>,
  ) => Promise<T>;

  streamts: <T extends OGIT.SafeNode = OGIT.Node>(
    timeseriesId: string,
    options?: {
      from?: number;
      to?: number;
      limit?: number;
      includeDeleted?: boolean;
      with?: string[];
    },
  ) => Promise<TimeseriesResponse[]>;

  history: <T = any>(
    id: string,
    options?: {
      offset?: number;
      limit?: number;
      from?: number;
      to?: number;
      version?: number;
      type?: string;
      listMeta?: boolean;
      includeDeleted?: boolean;
      vid?: string;
    },
  ) => Promise<T[]>;

  addServlet(
    prefix: string,
    servletMethods: ServletMethods,
    proxy?: string,
  ): Client;

  create<T extends OGIT.SafeNode = OGIT.Node>(
    type: string,
    data: any,
    reqOptions: ReqOptions,
  ): Promise<OGIT.Node>;

  update<T extends OGIT.SafeNode = OGIT.Node>(
    id: string,
    data: any,
    reqOptions: ReqOptions,
  ): Promise<OGIT.Node>;

  get<T extends OGIT.SafeNode = OGIT.Node>(id: string): Promise<T>;
}

/** Lucene */
type LuceneOptions<T> = '$not' | '$or' | '$must' | '$and' | '$missing' | T;

type LucenseBase<T extends string> = {
  [K in LuceneOptions<T>]?: string | string[] | LucenseBase<T>;
};
interface LuceneSpecial {
  $search?: { type: 'ngram' | 'prefix'; term: string; field?: string } | string;
  $range?: { [index: string]: [number, number] };
}
interface LucenseAny {
  [index: string]: string | string[] | LucenseAny;
}

export type LuceneQuery<T extends string = string> = LucenseBase<T> &
  LuceneSpecial &
  LucenseAny;

export const lucene: <T extends string = string>(
  query: LuceneQuery<T>,
  entity?: any,
) => {
  querystring: string;
  placeholders: object;
};

/** Gremlin */
export class GremlinQueryBuilder {
  constructor(initialQuery: string);

  toString(): string;

  raw(query: string): GremlinQueryBuilder;
  append(query: string): GremlinQueryBuilder;
  transform(
    transforms:
      | Array<string | GremlinQueryBuilder>
      | { [key: string]: string | GremlinQueryBuilder },
  ): GremlinQueryBuilder;
  copySplit(
    paths: Array<GremlinQueryBuilder | string>,
    mergeType: 'fairMerge' | 'exhaustMerge',
  ): GremlinQueryBuilder;
  or(conditions: Array<GremlinQueryBuilder | string>): GremlinQueryBuilder;
  dedup(prop: string): GremlinQueryBuilder;
  limit(start: number, finish: number): GremlinQueryBuilder;
  order(): GremlinQueryBuilder;
  by(field: string): GremlinQueryBuilder;
  range(from: number, to: number): GremlinQueryBuilder;
  values(target: string): GremlinQueryBuilder;
  filter(condition: string): GremlinQueryBuilder;
  addTempProp(name: string, value: string): GremlinQueryBuilder;
  addComputedProp(
    name: string,
    query: GremlinQueryBuilder | string,
  ): GremlinQueryBuilder;
  groupBy(groupingProp: string, resultProp: string): GremlinQueryBuilder;
  groupCount(groupingProp: string): GremlinQueryBuilder;
  inE(...args: Array<string>): GremlinQueryBuilder;
  outE(...args: Array<string>): GremlinQueryBuilder;
  bothE(...args: Array<string>): GremlinQueryBuilder;
  inV(...args: Array<string>): GremlinQueryBuilder;
  outV(...args: Array<string>): GremlinQueryBuilder;
  bothV(...args: Array<string>): GremlinQueryBuilder;
  in(...args: Array<string>): GremlinQueryBuilder;
  out(...args: Array<string>): GremlinQueryBuilder;
  both(...args: Array<string>): GremlinQueryBuilder;
  count(...args: Array<string>): GremlinQueryBuilder;
  as(...args: Array<string>): GremlinQueryBuilder;
  back(...args: Array<string>): GremlinQueryBuilder;
  shuffle(...args: Array<string>): GremlinQueryBuilder;
  has(...args: Array<string>): GremlinQueryBuilder;
  hasNot(...args: Array<string>): GremlinQueryBuilder;
  tree(): GremlinQueryBuilder;
  property(...args: Array<string>): GremlinQueryBuilder;
  getProperty(...args: Array<string>): GremlinQueryBuilder;
}

export function gremlin(
  initialQuery: string | GremlinQueryBuilder,
): GremlinQueryBuilder;
