import Client from "@hiro-graph/client";

export type OneOrMoreVertices<T extends IDefinition> =
    | GraphVertex<T>
    | Array<GraphVertex<T>>;
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

type GetRelations<T extends IDefinition> = keyof T["relations"];

export class BaseContext<T extends IDefinition> {
    find(query: LuceneQuery, options?: object): Promise<OneOrMoreVertices<T>>;
    findById(
        idOrIds: string | Array<string>,
        options?: object
    ): Promise<OneOrMoreVertices<T>>;
    findOne(query: any, options?: object): Promise<GraphVertex<T>>;
    findCount(query: LuceneQuery, options?: object): Promise<number>;
    search(
        query: string | object,
        filter: LuceneQuery,
        options?: object
    ): Promise<OneOrMoreVertices<T>>;
    fetchCount(
        relations: Array<string>,
        options?: object
    ): (items: OneOrMoreVertices<T>) => Promise<OneOrMoreVertices<T>>;
    fetchIds(
        relations: Array<string>,
        options?: object
    ): (items: OneOrMoreVertices<T>) => Promise<OneOrMoreVertices<T>>;
    fetchVertices(
        relations: Array<GetRelations<T>>,
        options?: object
    ): (items: OneOrMoreVertices<T>) => Promise<OneOrMoreVertices<T>>;
}

export class Entity<T extends IDefinition> extends BaseContext<T> {
    create(data: object, options?: object): Promise<GraphVertex<T>>;
    connect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex<T>>;
    disconnect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex<T>>;
    update(vertexId: string, appData: object, options?: object): GraphVertex<T>;
    replace(
        vertexId: string,
        appData: object,
        options?: object
    ): GraphVertex<T>;
    encode(appData: object): object;
    decode(graphData: object): object;
    relationQuery(relation: string): object;
    findRelationVertices(
        id: string,
        relations: Array<string>
    ): Promise<GraphVertex<T>>;
    findRelationIds(
        id: string,
        relations: Array<string>
    ): Promise<GraphVertex<T>>;
    findRelationCount(
        id: string,
        relations: Array<string>
    ): Promise<GraphVertex<T>>;
    hasRelation(id: string, relation: string, test: any): boolean;
}

export class GremlinQueryBuilder {
    order(): GremlinQueryBuilder;
    by(prop: string): GremlinQueryBuilder;
    range(from: number, to: number): GremlinQueryBuilder;
    execute<T>(id: string, options?: { raw: boolean }): Promise<T>;
}

export class LuceneQuery {}

export class Vertex {
    constructor(data: object);
    toJSON(): object;
    plain(): object;
    type(): string;
    get(prop: string): object;
    getFree(): object;
    getCount(relation: string): number;
    hasCount(relation: string): boolean;
    getIds(relation: string): Array<string>;
    hasIds(relation: string): boolean;
    set(prop: string, value: any): Vertex;
    setVertices(relation: string, nodes: Array<Vertex>): Vertex;
    setIds(relation: string, ids: Array<string>): Vertex;
    setCount(relation: string, count: number): Vertex;
}

export class GraphVertex<T extends IDefinition> extends Vertex {
    private _ctx: Context;

    constructor(data: object, context: Context, guardSymbol: Symbol);
    save(options?: object): Promise<GraphVertex<T>>;
    connect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex<T>>;
    disconnect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex<T>>;
    fetchCount(
        relations: Array<string>,
        options?: object
    ): Promise<GraphVertex<T>>;
    fetchIds(
        relations: Array<string>,
        options?: object
    ): Promise<GraphVertex<T>>;
    fetchVertices(
        relations: Array<GetRelations<T>>,
        options?: object
    ): Promise<GraphVertex<T>>;
    delete(options?: object): Promise<undefined>;
    getVertices(relation: string): Array<GraphVertex<T>>;
    hasVertices(relation: string): boolean;
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

export class Context<
    C extends IDefinition = { name: ""; ogit: "" }
> extends BaseContext<C> {
    private _cache: Map<string, object>;
    private _client: Client;
    private _log: string[];

    constructor(
        clientSpec: Client | IClientArgs,
        schemaSpec: Schema | Array<IDefinition>,
        cache?: Map<string, object>
    );

    me<N extends IDefinition>(): Promise<GraphVertex<N>>;
    person<N extends IDefinition>(): Promise<GraphVertex<N>>;
    getClient<T extends IClientServlets>(): Client & T;
    setCache(cache: Map<string, object>): void;
    deleteFromCache(key: string): boolean;

    delete<N extends IDefinition>(
        vertexId: string,
        options?: object
    ): Promise<GraphVertex<N>>;
    gremlin(initialQuery?: string): GremlinQueryBuilder;
    getEntity<N extends IDefinition>(name: string): Entity<N> | undefined;
    remove(vertexId: string): undefined;
    insertRaw<N extends IDefinition>(rawData: object): GraphVertex<N>;
    insert<N extends IDefinition>(appData: object): GraphVertex<N>;
}

export type ORM<
    T extends string,
    M extends { [index: string]: IDefinition }
> = Context & { [k in T]: Entity<M[k]> };

export default Context;
