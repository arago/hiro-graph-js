// Data

export namespace OGIT {
    export interface Node {
        "ogit/_id": string;
        "ogit/_type": string;
        [index: string]: string | number;
    }
}

export interface NodeHistory<T extends OGIT.Node = OGIT.Node> {
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
    fetch: <T = object>(
        url: string,
        init?: import("node-fetch").RequestInit,
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    gremlin: <T extends OGIT.Node = OGIT.Node>(
        root: string,
        query: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    lucene: <T extends OGIT.Node = OGIT.Node>(
        query: string,
        options?: BaseOptions & {
            order?: string;
            fields?: string[];
            count?: number;
            [index: string]: any;
        },
        reqOptions?: ReqOptions<T>
    ) => Promise<T[]>;
    history: <T extends OGIT.Node = OGIT.Node>(
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
}

export type ClientWithServlets<
    Servlets extends { [index: string]: Servlet }
> = Client & Servlets;
