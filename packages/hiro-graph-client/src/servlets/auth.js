import { AUTH_API_BASE, IAM_API_BASE } from '../api-version';

const URL_PATH_ACCOUNTS = 'accounts';
const URL_PATH_PROFILE = 'profile';
const URL_PATH_AVATAR = 'avatar';
const URL_PATH_TEAMS = 'teams';
const URL_PATH_ROLE = 'role';
const URL_PATH_ROLES = 'roles';
const URL_PATH_TEAM = 'team';
const URL_PATH_ORGANIZATION = 'organization';
const URL_PATH_MEMBERS = 'members';
const URL_PATH_ROLE_ASSIGNMENTS = 'roleassignments';
const URL_PATH_ORG_DOMAIN = 'domain';
const URL_PATH_ORG_DOMAINS = 'domains';
const URL_PATH_DATA_SCOPE = 'scope';
const URL_PATH_DATA_SCOPES = 'scopes';
const URL_PATH_DATA_SETS = 'datasets';

const toPath = (...paths) => `${IAM_API_BASE}/${paths.join('/')}`;

// TODO: move methods to corresponding servlets (auth, me, iam, saas)
export default function authServletFactory(fetch, options) {
    return {
        getAvatar: (id) =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR), {
                ...options,
                raw: true,
            }),

        getOrgAvatar: (id) =>
            fetch(toPath(URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR), {
                ...options,
                raw: true,
            }),

        getAccount: (id) =>
            fetch(toPath(URL_PATH_ACCOUNTS, id) + '?profile=true', options),

        getAccountProfile: (id) =>
            fetch(toPath(URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id), options),

        getAccountProfileByAccountId: (id) =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_PROFILE), options),

        getTeam: (id) => fetch(toPath(URL_PATH_TEAM, id), options),

        getTeamMembers: (id) =>
            fetch(
                toPath(URL_PATH_TEAM, id, URL_PATH_MEMBERS) + '?profile=true',
                options,
            ),

        getOrganizationMembers: (id) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_MEMBERS) +
                    '?profile=true',
                options,
            ),

        organizationTeams: (id, virtual = false) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_TEAMS) +
                    (virtual ? '?include-virtual=true' : ''),
                options,
            ),

        accountTeams: (id) =>
            fetch(toPath(URL_PATH_ACCOUNTS, id, URL_PATH_TEAMS), options),

        organizationDomains: (id) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ORG_DOMAINS),
                options,
            ),

        organizationRoleAssignments: (id) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_ROLE_ASSIGNMENTS) +
                    '?detail=true',
                options,
            ),

        getDomainOrganization: (id) =>
            fetch(
                toPath(URL_PATH_ORG_DOMAIN, id, URL_PATH_ORGANIZATION),
                options,
            ),

        organizationScopes: (id) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SCOPES),
                options,
            ),

        getDataScope: (id) => fetch(toPath(URL_PATH_DATA_SCOPE, id), options),

        organizationDataSets: (id) =>
            fetch(
                toPath(URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SETS),
                options,
            ),

        listAllRoles: () => fetch(toPath(URL_PATH_ROLES), options),

        listRoles: (limit, offset, name) => {
            return fetch(toPath(URL_PATH_ROLE), {
                ...options,
                body: JSON.stringify({ limit, offset, name }),
            });
        },

        revoke: (clientId) => {
            return fetch(`${AUTH_API_BASE}/revoke`, {
                ...options,
                method: 'POST',
                body: JSON.stringify({ client_id: clientId }),
            });
        },
    };
}
