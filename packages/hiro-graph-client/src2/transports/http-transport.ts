import fetch from 'isomorphic-fetch';

import { httpTypesPathMap } from './schema';
import { POJO, RequestType, Token, Transport } from '../types';

export class HttpTransport implements Transport {
  private readonly endpoint: string;
  private readonly version: string;
  private readonly prefix: string;
  private readonly createFetchOptions: (
    graphApiPrefix: string,
    type: RequestType,
    headers: POJO,
    body?: POJO,
  ) => [string, POJO];

  constructor(endpoint: string, version: string, prefix: string) {
    if (!httpTypesPathMap[version]) {
      throw new Error(
        `HTTP Graph api version: ${version} is not supported yet`,
      );
    }

    this.endpoint = endpoint.replace(/\/$/, ''); //remove trailing slash.
    this.version = version;
    this.prefix = prefix;
    this.createFetchOptions = httpTypesPathMap[version];
  }

  async fetch(token: Token, url: string, options: any) {
    const tp = await token.get();
    const finalUrl = url.indexOf('http') === 0 ? url : this.endpoint + url;
    const finalOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: 'Bearer ' + tp,
      },
    };
    const fetchPromise = fetch(finalUrl, finalOptions);

    if (options.raw === true) {
      return fetchPromise;
    }

    return fetchPromise.then((response) => {
      return response
        .json()
        .then((object) => {
          if ('error' in object) {
            const message = 'Unknown error';

            if (typeof object.error === 'string') {
              throw {
                message: '[HTTP] Request Error:' + object.error,
                status: response.status,
                code: response.status,
              };
            }

            if (object.error && typeof object.error.message === 'string') {
              throw {
                message: '[HTTP] Request Error:' + object.error.message,
                status: response.status,
                code: response.status,
              };
            }

            throw {
              message: '[HTTP] Request Error:' + message,
              status: response.status,
              code: response.status,
            };
          }

          if ('items' in object) {
            return object.items;
          }

          return object;
        })
        .catch((error) => {
          return {
            message: '[HTTP] Transport error:' + error.message,
            status: response.status,
          };
        });
    });
  }

  async request<T>(token: Token, type: RequestType, options: POJO): Promise<T> {
    const [url, finalOpts] = this.createFetchOptions(
      this.endpoint,
      type,
      options.headers,
      options.body,
    );

    return this.fetch(token, url, finalOpts);
  }
}
