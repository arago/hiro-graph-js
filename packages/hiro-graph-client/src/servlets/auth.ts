import { Client } from '../client';
import { Endpoint } from '../endpoint';
import { OGIT } from '../types';

export const Auth = {
  name: 'auth' as const,
  create: function (this: Client) {
    const endpoint = new Endpoint(this.endpoint).use('auth');

    return {
      getMeProfile: () => this.fetch(endpoint.path(['me', 'profile'])),

      updateMeProfile: (data: Partial<OGIT.Auth.AccountProfile>) => {
        const url = endpoint.path(['me', 'profile']);

        return this.fetch(url, {
          method: 'POST',
          json: data,
        });
      },

      getMeAvatar: () =>
        this.fetch(endpoint.path(['me', 'avatar']), { raw: true }),

      meAccount: () => this.fetch(endpoint.path(['me', 'account'])),

      mePassword: (oldPassword: string, newPassword: string) => {
        return this.fetch(endpoint.path(['me', 'password']), {
          method: 'PUT',
          json: {
            oldPassword,
            newPassword,
          },
        });
      },

      meTeams: () => fetch(endpoint.path(['me', 'teams'])),

      updateMeAvatar: (data: File) => {
        return this.fetch(endpoint.path(['me', 'avatar']), {
          method: 'PUT',
          body: data,
          headers: {
            'Content-Type': data.type,
          },
          raw: true,
        });
      },

      meRoles: () => {
        return this.fetch(endpoint.path(['me', 'roles']));
      },

      revoke: (clientId: string) => {
        return this.fetch(endpoint.path('revoke'), {
          method: 'POST',
          json: { client_id: clientId },
        });
      },
    };
  },
};
