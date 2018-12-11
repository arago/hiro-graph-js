interface IEnv {
    HIRO_CLIENT_ID: string;
    HIRO_CLIENT_SECRET: string;
    HIRO_GRAPH_URL: string;
    HIRO_GRAPH_USER_NAME: string;
    HIRO_GRAPH_USER_PASSWORD: string;
}

interface IConfig {
    orgs: Array<IPopulateValue>;
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
