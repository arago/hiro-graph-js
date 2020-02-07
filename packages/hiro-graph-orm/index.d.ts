import Client, { LuceneQuery, GremlinQueryBuilder } from '@hiro-graph/client';

export interface IDefinitionData {
  [index: string]: string;
}

export interface IClientArgs {
  endpoint: string;
  token: string;
}

export interface IDefinition {
  name: string;
  ogit: string;
  required?: IDefinitionData;
  optional?: IDefinitionData;
  relations?: IDefinitionData;
  [name: string]: string | IDefinitionData | undefined;
}

interface IQueryOptions {
  raw?: boolean;
  plain?: boolean;
  order?: string;
  offset?: number;
  limit?: number;
}

export class Entity<T extends GraphVertex> {
  create(data: object, options?: IQueryOptions): Promise<T>;
  connect(relation: string, vertexOrId: string | Vertex): Promise<T>;
  disconnect(relation: string, vertexOrId: string | Vertex): Promise<T>;
  update(vertexId: string, appData: object, options?: IQueryOptions): T;
  replace(vertexId: string, appData: object, options?: IQueryOptions): T;
  encode(appData: object): object;
  decode(graphData: object): object;
  relationQuery(relation: string): object;
  findRelationVertices(id: string, relations: Array<string>): Promise<T>;
  findRelationIds(id: string, relations: Array<string>): Promise<T>;
  findRelationCount(id: string, relations: Array<string>): Promise<T>;
  hasRelation(id: string, relation: string, test: any): boolean;
  fetchCount(
    relations: Array<string>,
    options?: IQueryOptions,
  ): (items: T) => Promise<T>;
  fetchIds(
    relations: Array<string>,
    options?: IQueryOptions,
  ): (items: T) => Promise<T>;
  fetchVertices(
    relations: Array<string>,
    options?: IQueryOptions,
  ): (items: T) => Promise<T>;
  find<SearchKeys extends string = string>(
    query: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<T[]>;
  findById(idOrIds: string, options?: IQueryOptions): Promise<T>;
  findById(idOrIds: Array<string>, options?: IQueryOptions): Promise<T[]>;
  findOne<SearchKeys extends string = string>(
    query: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<T>;
  findCount<SearchKeys extends string = string>(
    query: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<number>;
  search<SearchKeys extends string = string>(
    query: string | object,
    filter: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<T | T[]>;
}

type SetterObject<Props extends string> = Partial<{ [k in Props]: any }>;

export class Vertex<
  RelationTypes extends string = string,
  Props extends string = string
> {
  constructor(data: object);
  toJSON(): any;
  plain(): any;
  type(): string;
  get<V = any>(prop: Props): V;
  getFree(): object;
  getCount(relation: RelationTypes): number;
  hasCount(relation: RelationTypes): boolean;
  getIds(relation: RelationTypes): Array<string>;
  hasIds(relation: RelationTypes): boolean;
  set(values: SetterObject<Props>): this;
  set(prop: Props, value: any): this;
  setVertices(
    relation: RelationTypes,
    nodes: Array<Vertex<RelationTypes, Props>>,
  ): this;
  setIds(relation: RelationTypes, ids: Array<string>): this;
  setCount(relation: RelationTypes, count: number): this;
}

declare type defaultProps =
  | '_created-on'
  | '_fetched'
  | '_id'
  | '_modified-by'
  | '_modified-on'
  | '_organization'
  | '_owner'
  | '_scope'
  | '_type';

export type PlainVertex<Required = {}, Optional = {}, Relations = {}> = {
  [K in defaultProps]: any;
} &
  { [K in keyof Required]: any } &
  { [K in keyof Optional]?: any } & {
    _rel: Relations;
    _free: { [index: string]: any };
  };

export class GraphVertex<
  RelationTypes extends string = string,
  Props extends string = string
> extends Vertex<RelationTypes, Props | defaultProps> {
  private _ctx: Context;
  _id: string;
  _counts: { [K in RelationTypes]?: number };
  _ids: { [K in RelationTypes]?: string[] };
  _clean: boolean;
  _before: object;

  constructor(data: object, context: Context, guardSymbol: Symbol);
  save(options?: IQueryOptions): Promise<this>;
  connect(relation: RelationTypes, vertexOrId: string | Vertex): Promise<this>;
  disconnect(
    relation: RelationTypes,
    vertexOrId: string | Vertex,
  ): Promise<this>;
  fetchCount(
    relations: Array<RelationTypes>,
    options?: IQueryOptions,
  ): Promise<this>;
  fetchIds(
    relations: Array<RelationTypes>,
    options?: IQueryOptions,
  ): Promise<this>;
  fetchVertices(
    relations: Array<RelationTypes>,
    options?: IQueryOptions,
  ): Promise<this>;
  delete(options?: IQueryOptions): Promise<undefined>;
  getVertices<N extends GraphVertex>(relation: RelationTypes): Array<N>;
  hasVertices(relation: RelationTypes): boolean;
  canWrite(): Promise<boolean>;
}

export class Schema {
  constructor(params: IClientArgs, options?: IQueryOptions);
}

export type IClientServlets = {
  [index: string]: {
    [index: string]: (...args: any) => Promise<any>;
  };
};

type FetchReturn = <T extends GraphVertex | GraphVertex[]>(
  items: T,
) => Promise<T>;

export default class Context {
  private _cache: Map<string, object>;
  private _client: Client;
  private _log: string[];

  constructor(
    clientSpec: Client | IClientArgs,
    schemaSpec: Schema | Array<IDefinition>,
    cache?: Map<string, object>,
  );

  me<T extends GraphVertex>(): Promise<T>;
  profile<T extends GraphVertex>(): Promise<T>;
  getClient<T extends IClientServlets>(): Client & T;
  setCache(cache: Map<string, object>): void;
  deleteFromCache(key: string): boolean;

  delete<T extends GraphVertex>(
    vertexId: string,
    options?: IQueryOptions,
  ): Promise<T>;
  gremlin(initialQuery?: string): GremlinQueryBuilder;
  getEntity<T extends GraphVertex>(name: string): Entity<T> | undefined;
  remove(vertexId: string): undefined;
  insertRaw<T extends GraphVertex>(rawData: object): T;
  insert<T extends GraphVertex>(appData: object): T;

  // Fetch

  fetchCount(relations: Array<string>, options?: IQueryOptions): FetchReturn;
  fetchIds(relations: Array<string>, options?: IQueryOptions): FetchReturn;
  fetchVertices(relations: Array<string>, options?: IQueryOptions): FetchReturn;
  find<T extends GraphVertex, SearchKeys extends string = string>(
    query: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<T | T[]>;
  findById<T extends GraphVertex>(
    idOrIds: string,
    options?: IQueryOptions,
  ): Promise<T>;
  findById<T extends GraphVertex>(
    idOrIds: Array<string>,
    options?: IQueryOptions,
  ): Promise<Array<T>>;
  findOne<T extends GraphVertex>(
    query: any,
    options?: IQueryOptions,
  ): Promise<T>;
  findCount<T extends GraphVertex, SearchKeys extends string = string>(
    query: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<number>;
  search<T extends GraphVertex, SearchKeys extends string = string>(
    query: string | object,
    filter: LuceneQuery<SearchKeys>,
    options?: IQueryOptions,
  ): Promise<T | T[]>;
}

export type ORM<
  T extends string, // Union of mapping names
  M extends { [index: string]: GraphVertex } // Map from mapping name -> class
> = Context & { [k in T]: Entity<M[k]> };
