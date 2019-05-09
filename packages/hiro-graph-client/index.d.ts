// Auth API

import { w3cwebsocket as WS } from "websocket";
import fetch, { Response } from "node-fetch";
import { ReduxToken } from "@hiro-graph/redux";

// HttpTransport

interface IRequestParams {
    type: string;
    headers?: object;
    body?: object;
}

declare class HttpTransport {
    endpoint: string;
    constructor(endpoint: string);
    fetch(
        token: string,
        url: string,
        options?: object,
        reqOptions?: object
    ): Promise<Response>;
    request(
        token: string,
        params?: IRequestParams,
        reqOptions?: object
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
    token: ReduxToken;
    http: HttpTransport;
    transport: WebSocketTransport | HttpTransport;
    fetch: (
        url: string,
        options?: object,
        reqOptions?: object
    ) => Promise<Response>;

    constructor(
        params: IClientParams,
        transportOptions?: object,
        proxies?: string[]
    );
    me(): object;
    getToken(): ReduxToken;
    addServlet(
        prefix: string,
        servletMethods: IServletMethods,
        proxy?: string
    ): Client;
}
