import Client from "hiro-graph-client";

export type OneOrMoreVertices = GraphVertex | Array<GraphVertex>;
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

export class BaseContext {
    find(query: LuceneQuery, options?: object): Promise<OneOrMoreVertices>;
    findById(
        idOrIds: string | Array<string>,
        options?: object
    ): Promise<OneOrMoreVertices>;
    findOne(query: any, options?: object): Promise<GraphVertex>;
    findCount(query: LuceneQuery, options?: object): Promise<number>;
    search(
        query: string | object,
        filter: LuceneQuery,
        options?: object
    ): Promise<OneOrMoreVertices>;
    fetchCount(
        relations: Array<string>,
        options?: object
    ): (items: OneOrMoreVertices) => Promise<OneOrMoreVertices>;
    fetchIds(
        relations: Array<string>,
        options?: object
    ): (items: OneOrMoreVertices) => Promise<OneOrMoreVertices>;
    fetchVertices(
        relations: Array<string>,
        options?: object
    ): (items: OneOrMoreVertices) => Promise<OneOrMoreVertices>;
}

export class Entity extends BaseContext {
    create(data: object, options?: object): Promise<GraphVertex>;
    connect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex>;
    disconnect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex>;
    update(vertexId: string, appData: object, options?: object): GraphVertex;
    replace(vertexId: string, appData: object, options?: object): GraphVertex;
    encode(appData: object): object;
    decode(graphData: object): object;
    relationQuery(relation: string): object;
    findRelationVertices(
        id: string,
        relations: Array<string>
    ): Promise<GraphVertex>;
    findRelationIds(id: string, relations: Array<string>): Promise<GraphVertex>;
    findRelationCount(
        id: string,
        relations: Array<string>
    ): Promise<GraphVertex>;
    hasRelation(id: string, relation: string, test: any): boolean;
}

export class GremlinQueryBuilder {}

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

export class GraphVertex extends Vertex {
    private _ctx: Context;

    constructor(data: object, context: Context, guardSymbol: Symbol);
    save(options?: object): Promise<GraphVertex>;
    connect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex>;
    disconnect(
        relation: string,
        vertexOrId: string | Vertex
    ): Promise<GraphVertex>;
    fetchCount(
        relations: Array<string>,
        options?: object
    ): Promise<GraphVertex>;
    fetchIds(relations: Array<string>, options?: object): Promise<GraphVertex>;
    fetchVertices(
        relations: Array<string>,
        options?: object
    ): Promise<GraphVertex>;
    delete(options?: object): Promise<undefined>;
    getVertices(relation: string): Array<GraphVertex>;
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

export class Context extends BaseContext {
    constructor(
        clientSpec: Client | IClientArgs,
        schemaSpec: Schema | Array<IDefinition>,
        cache?: Map<string, object>
    );

    me(): Promise<GraphVertex>;
    person(): Promise<GraphVertex>;
    getClient<T extends IClientServlets>(): Client & T;
    setCache(cache: Map<string, object>): void;

    delete(vertexId: string, options?: object): Promise<GraphVertex>;
    gremlin(initialQuery?: string): GremlinQueryBuilder;
    getEntity(name: string): Entity | undefined;
    remove(vertexId: string): undefined;
    insertRaw(rawData: object): GraphVertex;
    insert(appData: object): GraphVertex;
}

export type ORM<T extends string> = Context & { [k in T]: Entity };

export default Context;
