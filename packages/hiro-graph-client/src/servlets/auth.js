const filterUndef = obj =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }
        return ret;
    }, {});

const PATH = "/api/6.1/iam";
const QUERY_PARAM_NAME = "name";
const QUERY_PARAM_ACTIVE = "active";
const QUERY_PARAM_CONTENT = "content";
const URL_PATH_ACCOUNTS = "accounts";
const URL_PATH_ACCOUNT = "account";
const URL_PATH_PROFILE = "profile";
const URL_PATH_PROFILES = "profiles";
const URL_PATH_AVATAR = "avatar";
const URL_PATH_PASSWORD = "password";
const URL_PATH_TEAMS = "teams";
const URL_PATH_ROLE = "role";
const URL_PATH_ROLES = "roles";
const URL_PATH_DATASET = "dataset";
const URL_PATH_TEAM = "team";
const URL_PATH_ORGANIZATION = "organization";
const URL_PATH_MEMBERS = "members";
const URL_PATH_ROLE_ASSIGNMENT = "roleassignment";
const URL_PATH_ORG_DOMAIN = "domain";
const URL_PATH_ORG_DOMAINS = "domains";
const URL_PATH_ORG_SCOPE = "scope";
const URL_PATH_ORG_SCOPES = "scopes";
const URL_PATH_DATA_SETS = "datasets";
const URL_PATH_ME = "me";
const URL_PATH_ACTIVATE = "activate";
const URL_PATH_DEACTIVATE = "deactivate";

const toPath = (...paths) => `${PATH}/${paths.join("/")}`;

export default {
    // createAccount
    // deactivateAccount
    getAvatar: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR), {
            ...options,
            raw: true
        }),
    // setAvatar
    // updateAccount
    getAccount: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id), options),
    updateAccountProfile: (fetch, options, id, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), options);
    },
    getAccountProfile: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), options),
    getAccountProfileByAccountId: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_PROFILE), options),
    listRoles: (fetch, options, limit, offset, name) => {
        options.body = JSON.stringify({ limit, offset, name });
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ROLE), options);
    },
    updatePassword: (fetch, options, id, password) => {
        options.method = "PUT";
        options.body = JSON.stringify({ password });
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ACCOUNTS, id, "password"), options);
    },
    activateAccount: (fetch, options, id) => {
        options.method = "PATCH";
        options.body = JSON.stringify({});
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_ACTIVATE), options);
    },
    // updateDataSet
    // getDataSet
    // deleteDataSet
    createTeam: (fetch, options, data) => {
        options.method = "POST";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_TEAM), options);
    },
    updateTeam: (fetch, options, id, data) => {
        options.method = "PUT";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_TEAM, id), options);
    },
    getTeam: (fetch, options, id) => fetch(toPath(URL_PATH_TEAM, id), options),
    deleteTeam: (fetch, options, id) => {
        options.method = "DELETE";
        options.headers["Content-Type"] = "application/json";

        return fetch(`${PATH}/${URL_PATH_TEAM}/${id}`, options);
    },
    // createRole
    // updateRole
    // getRole
    // deleteRole
    // createOrganization
    addMembers: (fetch, options, id, ...accounts) => {
        options.method = "POST";
        options.body = JSON.stringify({ accounts: accounts.join(",") });
        options.headers["Content-Type"] = "application/json";

        return fetch(
            toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "add"),
            options
        );
    },
    removeMembers: (fetch, options, id, ...accounts) => {
        options.method = "POST";
        options.body = JSON.stringify({ accounts: accounts.join(",") });
        options.headers["Content-Type"] = "application/json";

        return fetch(
            toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "remove"),
            options
        );
    },
    getTeamMembers: (fetch, options, id) =>
        fetch(toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS), options),
    getOrganizationMembers: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_MEMBERS), options),
    organizationTeams: (fetch, options, id) =>
        fetch(`${PATH}/organization/${id}/${URL_PATH_TEAMS}`, options)
    // createRoleAssignment
    // getRoleAssignment
    // deleteRoleAssignment
    // deleteFromPth
    // getFromPath
    // createFromPath
    // updateFromPath
    // createDomain
    // getDomain
    // deleteDomain
    // organizationDomains
    // getDomainOrganization
    // createDataScope
    // updateDataScope
    // getDataScope
    // organizationDataSets
    // organizationDataScopes
    // listRoles - no params
};
