import { Client } from '../client';
import { Endpoint } from '../endpoint';

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

export const IAM = {
  name: 'iam' as const,
  create: function (this: Client) {
    const endpoint = new Endpoint(this.endpoint).use('iam');

    return {
      getAvatar: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_ACCOUNTS, id, URL_PATH_AVATAR]), {
          raw: true,
        }),

      getOrgAvatar: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_AVATAR]),
          {
            raw: true,
          },
        ),

      getAccount: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_ACCOUNTS, id], { profile: true })),

      getAccountProfile: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_ACCOUNTS, URL_PATH_PROFILE, id])),

      getAccountProfileByAccountId: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_ACCOUNTS, id, URL_PATH_PROFILE])),

      getTeam: (id: string) => this.fetch(endpoint.path([URL_PATH_TEAM, id])),

      getTeamMembers: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_TEAM, id, URL_PATH_MEMBERS], {
            profile: true,
          }),
        ),

      getOrganizationMembers: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_MEMBERS], {
            profile: true,
          }),
        ),

      organizationTeams: (id: string, virtual: boolean = false) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_TEAMS], {
            'include-virtual': virtual ? true : undefined,
          }),
        ),

      accountTeams: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_ACCOUNTS, id, URL_PATH_TEAMS])),

      organizationDomains: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_ORG_DOMAINS]),
        ),

      organizationRoleAssignments: (id: string) =>
        this.fetch(
          endpoint.path(
            [URL_PATH_ORGANIZATION, id, URL_PATH_ROLE_ASSIGNMENTS],
            { detail: true },
          ),
        ),

      getDomainOrganization: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORG_DOMAIN, id, URL_PATH_ORGANIZATION]),
        ),

      organizationScopes: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SCOPES]),
        ),

      getDataScope: (id: string) =>
        this.fetch(endpoint.path([URL_PATH_DATA_SCOPE, id])),

      organizationDataSets: (id: string) =>
        this.fetch(
          endpoint.path([URL_PATH_ORGANIZATION, id, URL_PATH_DATA_SETS]),
        ),

      listAllRoles: () => this.fetch(endpoint.path([URL_PATH_ROLES])),

      listRoles: (limit: number, offset: number, name: string) => {
        return this.fetch(endpoint.path([URL_PATH_ROLE]), {
          json: { limit, offset, name },
        });
      },
    };
  },
};
