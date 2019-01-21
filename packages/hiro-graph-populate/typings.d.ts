import { ORM, IClientServlets, GraphVertex } from "@hiro-graph/orm";
import {
    MappedTypes,
    VertexLookup,
    AuthAccountVertex,
    AuthAccountProfileVertex,
    AuthAccountPlain,
    AuthAccountProfilePlain
} from "@hiro-graph/orm-mappings";

type Orm = {
    me(): Promise<AuthAccountVertex>;
    profile(): Promise<AuthAccountProfileVertex>;
} & ORM<MappedTypes, typeof VertexLookup>;

interface IEnv {
    HIRO_CLIENT_ID: string;
    HIRO_CLIENT_SECRET: string;
    HIRO_GRAPH_URL: string;
    HIRO_GRAPH_USER_NAME: string;
    HIRO_GRAPH_USER_PASSWORD: string;
}

interface IConfig {
    populate?: Array<IPopulateValue>;
    generate?: IGenerate;
}

interface IGenerate {
    orgs: {
        name: string;
        count: number;
    };
    users: IGeneratePerson;
    admins: IGeneratePerson;
}

interface IGeneratePerson {
    perOrg: number;
    password: string;
}

interface IPopulateValue {
    name: string;
    admins: Array<IPerson>;
    users: Array<IPerson>;
}

interface IPerson {
    name: string;
    email: string;
    password: string;
}
