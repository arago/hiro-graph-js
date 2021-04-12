/**
 *  Servlet extension for the "/variables/" endpoints.
 */

import { Client } from '../client';
import { Endpoint } from '../endpoint';

interface AddData {
  [index: string]: any;
}

interface SuggestData {
  name: string;
  full?: boolean;
  [index: string]: any;
}

interface DefineData {
  name: string;
  [index: string]: any;
}

export const Variables = {
  name: 'variables' as const,
  create: function (this: Client) {
    const endpoint = new Endpoint(this.endpoint).use('variables');

    return {
      add: (data: AddData) => {
        const url = endpoint.path();

        return this.fetch(url, {
          method: 'PUT',
          json: data,
        });
      },

      suggest: (data: SuggestData) => {
        const url = endpoint.path('suggest', data);

        return this.fetch(url);
      },

      define: (data: DefineData) => {
        const url = endpoint.path('define', data);

        return this.fetch(url);
      },
    };
  },
};
