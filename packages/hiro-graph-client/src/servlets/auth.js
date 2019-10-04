const filterUndef = obj =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }
        return ret;
    }, {});

const PATH = "/api/6.1/iam";
const URL_PATH_ACCOUNTS = "accounts";
const URL_PATH_PROFILE = "profile";
const URL_PATH_AVATAR = "avatar";
const URL_PATH_TEAMS = "teams";
const URL_PATH_ROLE = "role";
const URL_PATH_ROLES = "roles";
const URL_PATH_DATASET = "dataset";
const URL_PATH_TEAM = "team";
const URL_PATH_ORGANIZATION = "organization";
const URL_PATH_MEMBERS = "members";
const URL_PATH_ROLE_ASSIGNMENT = "roleassignment";
const URL_PATH_ROLE_ASSIGNMENTS = "roleassignments";
const URL_PATH_ORG_DOMAIN = "domain";
const URL_PATH_ORG_DOMAINS = "domains";
const URL_PATH_DATA_SCOPE = "scope";
const URL_PATH_DATA_SETS = "datasets";
const URL_PATH_ACTIVATE = "activate";
const URL_PATH_REVOKE = "revoke";

const toPath = (...paths) => `${PATH}/${paths.join("/")}`;

function putBinary(fetch, options, path, body) {
    return fetch(path, {
        ...options,
        method: "PUT",
        body,
        headers: {
            ...options.headers,
            "Content-Type": body.type
        },
        raw: true
    });
}

export default {
    // createAccount
    createAccount: (fetch, options, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ACCOUNTS), options);
    },
    // deactivateAccount
    getAvatar: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR), {
            ...options,
            raw: true
        }),
    getOrgAvatar: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR), {
            ...options,
            raw: true
        }),
    setAvatar: (fetch, options, id, avatar) =>
        putBinary(
            fetch,
            options,
            toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR),
            avatar
        ),
    setOrgAvatar: (fetch, options, id, avatar) =>
        putBinary(
            fetch,
            options,
            toPath(URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR),
            avatar
        ),
    // updateAccount
    getAccount: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id) + "?profile=true", options),
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
    createDataSet: (fetch, options, data) => {
        options.method = "POST";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_DATASET), options);
    },
    updateDataSet: (fetch, options, id, data) => {
        options.method = "PUT";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_DATASET, id), options);
    },
    getDataSet: (fetch, options, id) =>
        fetch(toPath(URL_PATH_DATASET, id), options),
    deleteDataSet: (fetch, options, id) => {
        options.method = "DELETE";
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_DATASET, id), options);
    },
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

        return fetch(toPath(URL_PATH_TEAM, id), options);
    },
    // createRole
    // updateRole
    // getRole
    // deleteRole
    createOrganization: (fetch, options, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ORGANIZATION), options);
    },
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
        fetch(
            toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS) + "?profile=true",
            options
        ),
    getOrganizationMembers: (fetch, options, id) =>
        fetch(
            toPath(URL_PATH_ORGANIZATION, id, URL_PATH_MEMBERS) +
                "?profile=true",
            options
        ),
    organizationTeams: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_TEAMS), options),
    accountTeams: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_TEAMS), options),
    createRoleAssignment: (fetch, options, data) => {
        options.method = "POST";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ROLE_ASSIGNMENT), options);
    },
    getRoleAssignment: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ROLE_ASSIGNMENT, id), options),
    deleteRoleAssignment: (fetch, options, id) => {
        options.method = "DELETE";
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ORG_DOMAIN, id), options);
    },
    // deleteFromPth
    // getFromPath
    // createFromPath
    // updateFromPath
    createDomain: (fetch, options, name, organization) => {
        options.method = "POST";
        options.body = JSON.stringify({
            name,
            organization
        });
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ORG_DOMAIN), options);
    },
    getDomain: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORG_DOMAIN, id), options),
    deleteDomain: (fetch, options, id) => {
        options.method = "DELETE";
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ORG_DOMAIN, id), options);
    },
    organizationDomains: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ORG_DOMAINS), options),
    organizationRoleAssignments: (fetch, options, id) =>
        fetch(
            toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ROLE_ASSIGNMENTS) +
                "?detail=true",
            options
        ),
    getDomainOrganization: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORG_DOMAIN, id, URL_PATH_ORGANIZATION), options),
    createDataScope: (fetch, options, data) => {
        options.method = "POST";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_DATA_SCOPE), options);
    },
    updateDataScope: (fetch, options, id, data) => {
        options.method = "PUT";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_DATA_SCOPE, id), options);
    },
    getDataScope: (fetch, options, id) =>
        fetch(toPath(URL_PATH_DATA_SCOPE, id), options),
    organizationDataSets: (fetch, options, id) =>
        fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SETS), options),
    // organizationDataScopes
    listAllRoles: (fetch, options) => fetch(toPath(URL_PATH_ROLES), options),
    listRoles: (fetch, options, limit, offset, name) => {
        options.body = JSON.stringify({ limit, offset, name });
        options.headers["Content-Type"] = "application/json";

        return fetch(toPath(URL_PATH_ROLE), options);
    },
    revoke: (fetch, options, clientId) => {
        options.method = "POST";
        options.headers["Content-Type"] = "application/json";

        options.body = JSON.stringify(JSON.stringify({
            client_id: clientId,
        }));

        return fetch(toPath(URL_PATH_REVOKE), options);
    }
};
