// HttpTransport

interface IRequestParams {
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
        params?: IRequestParams,
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
        params?: IRequestParams,
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
        clientParams: IClientParams,
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

interface IClientParams {
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
        params: IClientParams,
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
    gremlin: <T>(
        root: string,
        query: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    lucene: <T>(
        query: string,
        options?: BaseOptions & {
            order?: string;
            fields?: string[];
            count?: number;
            [index: string]: any;
        },
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    history: <T>(
        id: string,
        options?: {
            offset?: number;
            limit?: number;
            from?: number;
            to?: number;
            version?: number;
            type?: string;
        }
    ) => Promise<T>;
    addServlet(prefix: string, servletMethods: Servlet, proxy?: string): Client;
}

export type ClientWithServlets<
    Servlets extends { [index: string]: Servlet }
> = Client & Servlets;
