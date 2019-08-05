// Data

export namespace OGIT {
    export interface SafeNode {
        "ogit/_id": string;
        "ogit/_type": string;
        "ogit/_modified-on": number;
        "ogit/_modified-by": string;
        "ogit/_creator": string;
        "ogit/_created-on": number;
        "ogit/_is-deleted": boolean;
    }

    export interface Node extends SafeNode {
        [key: string]: string | number | boolean;
    }

    export interface Issue extends SafeNode {
        "ogit/_creator-app"?: string;
        "ogit/_graphtype"?: string;
        "ogit/_modified-by-app"?: string;
        "ogit/_owner"?: string;
        "ogit/_v"?: number;
        "ogit/_v-id"?: string;
        "ogit/subject"?: string;
        "ogit/status"?: string;
        "ogit/Automation/processingNode"?: string;
        "ogit/Automation/originNode"?: string;
    }

    export interface KnowledgeItem extends SafeNode {
        "ogit/Automation/knowledgeItemFormalRepresentation": string;
        "ogit/_creator-app"?: string;
        "ogit/_graphtype"?: string;
        "ogit/_modified-by-app"?: string;
        "ogit/_owner"?: string;
        "ogit/_v"?: number;
        "ogit/_v-id"?: string;
        "ogit/description"?: string;
        "ogit/isValid"?: string;
        "ogit/name"?: string;
    }

    export interface KnowledgePool extends SafeNode {
        "ogit/_creator-app"?: string;
        "ogit/_graphtype"?: string;
        "ogit/_is-deleted": boolean;
        "ogit/_modified-by-app"?: string;
        "ogit/_owner"?: string;
        "ogit/_v"?: number;
        "ogit/_v-id"?: string;
        "ogit/name"?: string;
    }
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

interface ReqOptions<T = any> {
    waitForIndex?: boolean;
    headers?: object;
    token?: string;
    emit?: (message: EmitMessage) => void;
    sub?: Subscriber<T>;
}

declare class HttpTransport {
    endpoint: string;
    constructor(endpoint: string);
    fetch(
        token: string,
        url: string,
        init?: import("node-fetch").RequestInit,
        reqOptions?: ReqOptions
    ): Promise<import("node-fetch").Response>;
    request(
        token: string,
        params?: RequestParams,
        reqOptions?: ReqOptions
    ): Promise<import("node-fetch").Response>;
    defaultFetchOptions(): {
        method: "GET";
        headers: {
            "Content-Type": "application/json";
            Accept: "application/json";
        };
        mode: "cors";
    };
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
        reqOptions?: object
    ): Promise<import("websocket").w3cwebsocket>;
    connect(
        token: string,
        emit: EmitHandler
    ): Promise<import("websocket").w3cwebsocket>;
    createWebSocket(
        initialToken: string,
        emit: EmitHandler
    ): Promise<import("websocket").w3cwebsocket>;
    defaultFetchOptions(): {
        method: "GET";
        headers: {
            "Content-Type": "application/json";
            Accept: "application/json";
        };
        mode: "cors";
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
    type: "CREATE" | "READ" | "UPDATE" | "DELETE" | "WRITETIMESERIES";
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
        emit?: (message: EmitMessage) => void
    );

    subscribe: <T = any>(handler: EventHandler) => EventUnsubscribe;
    register: (filter: string) => void;
    unregister: (filter: string) => void;
}

// Timeseries

export namespace TimeSeries {
    export interface Value<VariableNames extends string = string> {
        Entries: Entry[];
        Type: "start" | "execute" | "move" | "finish";

        Alternatives?: Alternatives;
        Changes?: Change<VariableNames>[];
        ContextHash?: string;
        Count?: number;
        Fingerprints?: Fingerprints;
        KIID?: string;
        KIVersion?: string;
        NodeID?: string;
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
        [key in VariableNames]: ChangeValue
    };

    export interface ChangeMeta {
        Action: "add" | "delete";
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

// Client

export class Token {
    constructor({
        onInvalidate,
        getMeta,
        getToken
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

export type IServletFetchType = typeof import("node-fetch").default;

export interface Servlet {
    [index: string]: ServletFunction;
}

export type ServletFunction<Data = any, Response = any> = (
    fetch: Client["fetch"],
    init?: import("node-fetch").RequestInit,
    data?: Data
) => Promise<Response>;

interface BaseOptions {
    offset?: number;
    limit?: number;
}

export default class Client {
    endpoint: string;
    token: Token;
    http: HttpTransport;
    transport: WebSocketTransport | HttpTransport;

    constructor(
        params: ClientParams,
        transportOptions?: object,
        proxies?: string[]
    );

    private _pubsub: {
        subscribe: (emit: EmitHandler) => void;
    };

    eventStream(filters?: string[], options?: EventStreamOptions): EventStream;
    getToken<T extends Token = Token>(): T;
    me(): object;
    fetch: <T = import("node-fetch").Response>(
        url: string,
        init?: import("node-fetch").RequestInit,
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    gremlin: <T extends OGIT.SafeNode = OGIT.Node>(
        root: string,
        query: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    connect: <T extends OGIT.SafeNode = OGIT.Node>(
        type: string,
        inId: string,
        outId: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    disconnect: <T extends OGIT.SafeNode = OGIT.Node>(
        type: string,
        inId: string,
        outId: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    lucene: <T extends OGIT.SafeNode = OGIT.Node>(
        query: string,
        options?: BaseOptions & {
            order?: string;
            fields?: string[];
            count?: boolean;
            [index: string]: any;
        },
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    streamts: <T extends OGIT.SafeNode = OGIT.Node>(
        timeseriesId: string,
        options?: {
            from?: number;
            to?: number;
            limit?: number;
        }
    ) => Promise<TimeseriesResponse[]>;
    history: <T extends OGIT.SafeNode = OGIT.Node>(
        id: string,
        options?: {
            offset?: number;
            limit?: number;
            from?: number;
            to?: number;
            version?: number;
            type?: string;
        }
    ) => Promise<NodeHistory<T>[]>;
    addServlet(prefix: string, servletMethods: Servlet, proxy?: string): Client;
    create(type: string, data: any, reqOptions: ReqOptions): Promise<OGIT.Node>;
    update(id: string, data: any, reqOptions: ReqOptions): Promise<OGIT.Node>;
    get(id: string): Promise<OGIT.Node>;
}

export type ClientWithServlets<
    Servlets extends { [index: string]: Servlet }
> = Client & Servlets;
