// Auth API

import { w3cwebsocket as WS } from "websocket";
import fetch, { Response } from "node-fetch";
import { ReduxToken } from "@hiro-graph/redux";

interface IAccountData {
    account: object;
    avatar: string;
    profile: object;
}

interface IAuth {
    createAccount: (
        data: object
    ) => Promise<{ account: object; profile: object }>;
    setAvatar: (id: string, avatar?: File) => Promise<any>;
    setOrgAvatar: (id: string, avatar?: File) => Promise<any>;
    getAvatar: (id: string) => Promise<any>;
    getOrgAvatar: (id: string) => Promise<any>;
    getAccount: (id: string) => Promise<IAccountData>;
    updateAccountProfile: (id: string, data: object) => Promise<object>;
    getAccountProfile: (id: string) => Promise<object>;
    getAccountProfileByAccountId: (id: string) => Promise<object>;
    listRoles: (
        limit: number,
        offset: number,
        name: string
    ) => Promise<object[]>;
    getRoleAssignment: (id: string) => Promise<object[]>;
    listAllRoles: () => Promise<object[]>;
    updatePassword: (id: string, password: string) => Promise<object>;
    activateAccount: (id: string) => Promise<object>;

    createTeam: (data: object) => Promise<object>;
    updateTeam: (id: string, data: object) => Promise<object>;
    getTeam: (id: string) => Promise<object>;
    deleteTeam: (id: string) => Promise<object>;
    createOrganization: (data: object) => Promise<object>;
    addMembers: (id: string, ...accounts: string[]) => Promise<object>;
    removeMembers: (id: string, ...accounts: string[]) => Promise<object>;
    getTeamMembers: (id: string) => Promise<IAccountData[]>;
    getOrganizationMembers: (id: string) => Promise<IAccountData[]>;
    organizationTeams: (id: string) => Promise<object[]>;
    createDomain: (name: string, organization: string) => Promise<object>;
    getDomain: (id: string) => Promise<object>;
    deleteDomain: (id: string) => Promise<object>;
    organizationDomains: (id: string) => Promise<object[]>;
    getDomainOrganization: (id: string) => Promise<object>;
    organizationRoleAssignments: (
        id: string
    ) => Promise<
        {
            "ogit/Auth/DataSet": object;
            "ogit/Auth/Role": object;
            "ogit/Auth/Team": object;
            "ogit/Auth/RoleAssignment": object;
        }[]
    >;
}

interface IAPI {
    getMeProfile: () => Promise<object>;
    updateMeProfile: (data: object) => Promise<object>;
    getMeAvatar: () => Promise<object>;
    meAccount: () => Promise<object>;
    mePassword: (oldPassword: string, newPassword: string) => Promise<object>;
    meTeams: () => Promise<object[]>;
    updateMeAvatar: (data: object) => Promise<object>;
}

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
        options: object,
        reqOptions: object
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
    auth: IAuth;
    api: IAPI;
    fetch: (
        url: string,
        options: object,
        reqOptions: object
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
