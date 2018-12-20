import Client from "@hiro-graph/client";

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
}

export class Entity<T extends GraphVertex> {
    create(data: object, options?: object): Promise<T>;
    connect(relation: string, vertexOrId: string | Vertex): Promise<T>;
    disconnect(relation: string, vertexOrId: string | Vertex): Promise<T>;
    update(vertexId: string, appData: object, options?: object): T;
    replace(vertexId: string, appData: object, options?: object): T;
    encode(appData: object): object;
    decode(graphData: object): object;
    relationQuery(relation: string): object;
    findRelationVertices(id: string, relations: Array<string>): Promise<T>;
    findRelationIds(id: string, relations: Array<string>): Promise<T>;
    findRelationCount(id: string, relations: Array<string>): Promise<T>;
    hasRelation(id: string, relation: string, test: any): boolean;
    fetchCount(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    fetchIds(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    fetchVertices(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    find(query: LuceneQuery, options?: object): Promise<T | T[]>;
    findById(idOrIds: string, options?: object): Promise<T>;
    findById(idOrIds: Array<string>, options?: object): Promise<T[]>;
    findOne(query: LuceneQuery, options?: object): Promise<T>;
    findCount(query: LuceneQuery, options?: object): Promise<number>;
    search(
        query: string | object,
        filter: LuceneQuery,
        options?: object
    ): Promise<T | T[]>;
}

export class GremlinQueryBuilder {
    order(): GremlinQueryBuilder;
    by(prop: string): GremlinQueryBuilder;
    range(from: number, to: number): GremlinQueryBuilder;
    execute<T>(id: string, options?: { raw: boolean }): Promise<T>;
}

export class LuceneQuery {}

type SetterObject<Props extends string> = Partial<{ [k in Props]: any }>;

export class Vertex<RelationTypes = string, Props extends string = string> {
    constructor(data: object);
    toJSON(): object;
    plain(): object;
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
        nodes: Array<Vertex<RelationTypes, Props>>
    ): this;
    setIds(relation: RelationTypes, ids: Array<string>): this;
    setCount(relation: RelationTypes, count: number): this;
}

declare type defaultProps = "_id" | "_modified-on" | "_organization" | "_owner";

export class GraphVertex<
    RelationTypes = string,
    Props extends string = string
> extends Vertex<RelationTypes, Props | defaultProps> {
    private _ctx: Context;
    _id: string;

    constructor(data: object, context: Context, guardSymbol: Symbol);
    save(options?: object): this;
    connect(relation: RelationTypes, vertexOrId: string | Vertex): this;
    disconnect(relation: RelationTypes, vertexOrId: string | Vertex): this;
    fetchCount(relations: Array<RelationTypes>, options?: object): this;
    fetchIds(relations: Array<RelationTypes>, options?: object): this;
    fetchVertices(relations: Array<RelationTypes>, options?: object): this;
    delete(options?: object): Promise<undefined>;
    getVertices<N extends GraphVertex>(relation: RelationTypes): Array<N>;
    hasVertices(relation: RelationTypes): boolean;
    canWrite(): Promise<boolean>;
}

export class Schema {
    constructor(params: IClientArgs, options?: object);
}

export type IClientServlets = {
    [index: string]: {
        [index: string]: (data?: any) => Promise<any>;
    };
};

export default class Context {
    private _cache: Map<string, object>;
    private _client: Client;
    private _log: string[];

    constructor(
        clientSpec: Client | IClientArgs,
        schemaSpec: Schema | Array<IDefinition>,
        cache?: Map<string, object>
    );

    me<T extends GraphVertex>(): Promise<T>;
    profile<T extends GraphVertex>(): Promise<T>;
    getClient<T extends IClientServlets>(): Client & T;
    setCache(cache: Map<string, object>): void;
    deleteFromCache(key: string): boolean;

    delete<T extends GraphVertex>(
        vertexId: string,
        options?: object
    ): Promise<T>;
    gremlin(initialQuery?: string): GremlinQueryBuilder;
    getEntity<T extends GraphVertex>(name: string): Entity<T> | undefined;
    remove(vertexId: string): undefined;
    insertRaw<T extends GraphVertex>(rawData: object): T;
    insert<T extends GraphVertex>(appData: object): T;

    // Fetch
    fetchCount<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    fetchCount<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T[]) => Promise<T[]>;
    fetchIds<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    fetchIds<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T[]) => Promise<T[]>;
    fetchVertices<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T) => Promise<T>;
    fetchVertices<T extends GraphVertex>(
        relations: Array<string>,
        options?: object
    ): (items: T[]) => Promise<T[]>;
    find<T extends GraphVertex>(
        query: LuceneQuery,
        options?: object
    ): Promise<T | T[]>;
    findById<T extends GraphVertex>(
        idOrIds: string,
        options?: object
    ): Promise<T>;
    findById<T extends GraphVertex>(
        idOrIds: Array<string>,
        options?: object
    ): Promise<Array<T>>;
    findOne<T extends GraphVertex>(query: any, options?: object): Promise<T>;
    findCount<T extends GraphVertex>(
        query: LuceneQuery,
        options?: object
    ): Promise<number>;
    search<T extends GraphVertex>(
        query: string | object,
        filter: LuceneQuery,
        options?: object
    ): Promise<T | T[]>;
}

export type ORM<
    T extends string, // Union of mapping names
    M extends { [index: string]: GraphVertex } // Map from mapping name -> class
> = Context & { [k in T]: Entity<M[k]> };
