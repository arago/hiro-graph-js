// Auth API

import { w3cwebsocket as WS } from "websocket";
import fetch, { Response } from "node-fetch";

// HttpTransport

interface IRequestParams {
    type: string;
    headers?: object;
    body?: object;
}

interface EmitMessage {
    name: "string";
    data?: object;
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
        options?: object,
        reqOptions?: ReqOptions
    ): Promise<Response>;
    request(
        token: string,
        params?: IRequestParams,
        reqOptions?: ReqOptions
    ): Promise<Response>;
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

type EmitFunctionType = (
    { name, data }: { name: string; data: object }
) => void;

declare class WebSocketTransport {
    endpoint: string;
    useLegacyProtocol: boolean;
    constructor(endpoint: string);
    request(
        token: string,
        params?: IRequestParams,
        reqOptions?: object
    ): Promise<WS>;
    connect(token: string, emit: EmitFunctionType): Promise<WS>;
    createWebSocket(initialToken: string, emit: EmitFunctionType): Promise<WS>;
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

interface Event<T = any> {
    id: string;
    identity: string;
    type: "CREATE" | "READ" | "UPDATE" | "DELETE" | "WRITETIMESERIES";
    timestamp: number;
    nanotime: number;
    body: T;
}

type Unsubscribe = () => void;

type EventHandler = <T = any>(event: Event<T>) => void;

declare class EventStream {
    constructor(
        clientParams: IClientParams,
        options?: EventStreamOptions & { filters?: string[] },
        emit?: (message: EmitMessage) => void
    );

    subscribe: <T = any>(handler: EventHandler) => Unsubscribe;
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
    token: string;
}

export type IServletFetchType = typeof fetch;

export interface IServletMethods {
    [index: string]: (
        fetch: IServletFetchType,
        options?: object,
        data?: object
    ) => void;
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
        subscribe: (message: EmitMessage) => void;
    };

    me(): object;
    eventStream(filters?: string[], options?: EventStreamOptions): EventStream;
    addServlet(
        prefix: string,
        servletMethods: IServletMethods,
        proxy?: string
    ): Client;
    fetch: (
        url: string,
        options?: object,
        reqOptions?: object
    ) => Promise<Response>;
    gremlin: <T>(
        root: string,
        query: string,
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    lucene: <T>(
        query: string,
        options?: object,
        reqOptions?: ReqOptions<T>
    ) => Promise<T>;
    getToken<T extends Token = Token>(): T;
}
