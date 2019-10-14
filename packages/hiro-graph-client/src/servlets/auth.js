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

// TODO: move methods to corresponding servlets (auth, me, iam, saas)
export default function authServletFactory(fetch, options) {
    return {
        createAccount: data => {
            return fetch(toPath(URL_PATH_ACCOUNTS), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

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
            return fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        getAccountProfile: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), options),

        getAccountProfileByAccountId: id =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_PROFILE), options),

        updatePassword: (id, password) => {
            return fetch(toPath(URL_PATH_ACCOUNTS, id, "password"), {
                ...options,
                method: "PUT",
                body: JSON.stringify({ password })
            });
        },

        activateAccount: id => {
            return fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_ACTIVATE), {
                ...options,
                method: "PATCH",
                body: "{}"
            });
        },

        createDataSet: data => {
            return fetch(toPath(URL_PATH_DATASET), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        updateDataSet: (id, data) => {
            options.method = "PUT";
            options.body = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";

            return fetch(toPath(URL_PATH_DATASET, id), {
                ...options,
                method: "PUT",
                body: JSON.stringify(data)
            });
        },

        getDataSet: id => fetch(toPath(URL_PATH_DATASET, id), options),

        deleteDataSet: id => {
            return fetch(toPath(URL_PATH_DATASET, id), {
                ...options,
                method: "DELETE"
            });
        },

        createTeam: data => {
            return fetch(toPath(URL_PATH_TEAM), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        updateTeam: (id, data) => {
            return fetch(toPath(URL_PATH_TEAM, id), {
                ...options,
                method: "PUT",
                body: JSON.stringify(data)
            });
        },

        getTeam: id => fetch(toPath(URL_PATH_TEAM, id), options),

        deleteTeam: id => {
            return fetch(toPath(URL_PATH_TEAM, id), {
                ...options,
                method: "DELETE"
            });
        },

        createOrganization: data => {
            return fetch(toPath(URL_PATH_ORGANIZATION), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        addMembers: (id, ...accounts) => {
            return fetch(toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "add"), {
                ...options,
                method: "POST",
                data: JSON.stringify({ accounts: accounts.join("/") })
            });
        },

        removeMembers: (id, ...accounts) => {
            return fetch(
                toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS, "remove"),
                {
                    ...options,
                    method: "POST",
                    data: JSON.stringify({ accounts: accounts.join("/") })
                }
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
            return fetch(toPath(URL_PATH_ROLE_ASSIGNMENT), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        getRoleAssignment: id =>
            fetch(toPath(URL_PATH_ROLE_ASSIGNMENT, id), options),

        deleteRoleAssignment: id => {
            return fetch(toPath(URL_PATH_ORG_DOMAIN, id), {
                ...options,
                method: "DELETE"
            });
        },

        createDomain: (name, organization) => {
            return fetch(toPath(URL_PATH_ORG_DOMAIN), {
                ...options,
                method: "POST",
                body: JSON.stringify({
                    name,
                    organization
                })
            });
        },

        getDomain: id => fetch(toPath(URL_PATH_ORG_DOMAIN, id), options),

        deleteDomain: id => {
            return fetch(toPath(URL_PATH_ORG_DOMAIN, id), {
                ...options,
                method: "DELETE"
            });
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
            return fetch(toPath(URL_PATH_DATA_SCOPE), {
                ...options,
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        updateDataScope: (id, data) => {
            return fetch(toPath(URL_PATH_DATA_SCOPE, id), {
                ...options,
                method: "PUT",
                body: JSON.stringify(data)
            });
        },

        organizationScopes: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SCOPE),
                options
            ),

        getDataScope: id => fetch(toPath(URL_PATH_DATA_SCOPE, id), options),

        organizationDataSets: id =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SETS),
                options
            ),

        listAllRoles: () => fetch(toPath(URL_PATH_ROLES), options),

        listRoles: (limit, offset, name) => {
            return fetch(toPath(URL_PATH_ROLE), {
                ...options,
                body: JSON.stringify({ limit, offset, name })
            });
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
