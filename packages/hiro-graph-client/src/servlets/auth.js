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

export default function authServletFactory(fetch, options) {
    return {
        // createAccount
        createAccount: data => {
            const payload = filterUndef(data);

            options.method = "POST";
            options.body = JSON.stringify(payload);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ACCOUNTS), options);
        },

        // deactivateAccount
        getAvatar: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR), {
                ...options,
                raw: true
            }),

        getOrgAvatar: id =>
            fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR), {
                ...options,
                raw: true
            }),

        setAvatar: (id, avatar) =>
            putBinary(
                fetch,
                options,
                toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR),
                avatar
            ),

        setOrgAvatar: (id, avatar) =>
            putBinary(
                fetch,
                options,
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR),
                avatar
            ),

        getAccount: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, id) + "?profile=true", options),

        updateAccountProfile: (id, data) => {
            const payload = filterUndef(data);

            options.method = "POST";
            options.body = JSON.stringify(payload);
            options.headers["Content-Type"] = "application/json";

            return fetch(
                toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id),
                options
            );
        },

        getAccountProfile: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), options),

        getAccountProfileByAccountId: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_PROFILE), options),

        updatePassword: (id, password) => {
            options.method = "PUT";
            options.body = JSON.stringify({ password });
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ACCOUNTS, id, "password"), options);
        },

        activateAccount: id => {
            options.method = "PATCH";
            options.body = JSON.stringify({});
            options.headers["Content-Type"] = "application/json";

            return fetch(
                toPath(URL_PATH_ACCOUNTS, id, URL_PATH_ACTIVATE),
                options
            );
        },

        createDataSet: data => {
            options.method = "POST";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATASET), options);
        },

        updateDataSet: (id, data) => {
            options.method = "PUT";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATASET, id), options);
        },

        getDataSet: id => fetch(toPath(URL_PATH_DATASET, id), options),

        deleteDataSet: id => {
            options.method = "DELETE";
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATASET, id), options);
        },

        createTeam: data => {
            options.method = "POST";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_TEAM), options);
        },

        updateTeam: (id, data) => {
            options.method = "PUT";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_TEAM, id), options);
        },

        getTeam: id => fetch(toPath(URL_PATH_TEAM, id), options),

        deleteTeam: id => {
            options.method = "DELETE";
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_TEAM, id), options);
        },

        createOrganization: data => {
            const payload = filterUndef(data);

            options.method = "POST";
            options.body = JSON.stringify(payload);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ORGANIZATION), options);
        },

        addMembers: (id, ...accounts) => {
            options.method = "POST";
            options.body = JSON.stringify({ accounts: accounts.join(",") });
            options.headers["Content-Type"] = "application/json";

            return fetch(
                toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "add"),
                options
            );
        },

        removeMembers: (id, ...accounts) => {
            options.method = "POST";
            options.body = JSON.stringify({ accounts: accounts.join(",") });
            options.headers["Content-Type"] = "application/json";

            return fetch(
                toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "remove"),
                options
            );
        },

        getTeamMembers: id =>
            fetch(
                toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS) + "?profile=true",
                options
            ),

        getOrganizationMembers: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_MEMBERS) +
                    "?profile=true",
                options
            ),

        organizationTeams: id =>
            fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_TEAMS), options),

        accountTeams: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_TEAMS), options),

        createRoleAssignment: data => {
            options.method = "POST";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ROLE_ASSIGNMENT), options);
        },

        getRoleAssignment: id =>
            fetch(toPath(URL_PATH_ROLE_ASSIGNMENT, id), options),

        deleteRoleAssignment: id => {
            options.method = "DELETE";
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ORG_DOMAIN, id), options);
        },

        createDomain: (name, organization) => {
            options.method = "POST";
            options.body = JSON.stringify({
                name,
                organization
            });
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ORG_DOMAIN), options);
        },

        getDomain: id => fetch(toPath(URL_PATH_ORG_DOMAIN, id), options),

        deleteDomain: id => {
            options.method = "DELETE";
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ORG_DOMAIN, id), options);
        },

        organizationDomains: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ORG_DOMAINS),
                options
            ),

        organizationRoleAssignments: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ROLE_ASSIGNMENTS) +
                    "?detail=true",
                options
            ),

        getDomainOrganization: id =>
            fetch(
                toPath(URL_PATH_ORG_DOMAIN, id, URL_PATH_ORGANIZATION),
                options
            ),

        createDataScope: data => {
            options.method = "POST";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATA_SCOPE), options);
        },

        updateDataScope: (id, data) => {
            options.method = "PUT";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATA_SCOPE, id), options);
        },

        getDataScope: id => fetch(toPath(URL_PATH_DATA_SCOPE, id), options),

        organizationDataSets: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SETS),
                options
            ),

        listAllRoles: () => fetch(toPath(URL_PATH_ROLES), options),

        listRoles: (limit, offset, name) => {
            options.body = JSON.stringify({ limit, offset, name });
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_ROLE), options);
        },

        revoke: clientId => {
            return fetch("/api/6/auth/revoke", {
                ...options,
                method: "POST",
                body: JSON.stringify({ client_id: clientId })
            });
        }
    };
}
