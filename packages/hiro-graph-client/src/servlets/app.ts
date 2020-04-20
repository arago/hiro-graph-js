import { Endpoint } from '../endpoint';
import { Client } from '../client';

export const Apps = {
  name: 'apps' as const,
  create: function (this: Client) {
    const endpoint = new Endpoint(this.endpoint).use('app');

    return {
      getAll: () => {
        const url = endpoint.path('desktop');

        return this.fetch(url);
      },

      getMy: () => {
        const url = endpoint.path(['desktop', 'installed']);

        return this.fetch(url);
      },

      install: (appId: string) => {
        const url = endpoint.path(['install', appId]);

        return this.fetch(url, {
          method: 'POST',
        });
      },

      uninstall: (appId: string) => {
        const url = endpoint.path(['uninstall', appId]);

        return this.fetch(url, {
          method: 'POST',
        });
      },
    };
  },
};
