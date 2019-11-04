import { GraphClient, POJO } from '../types';

export interface VariablesExtension {
  // TODO: define Variable interface
  add<T = any>(data: any): Promise<T>;

  suggest<T = any>(name: string, full: boolean, ...args: any[]): Promise<T>;

  define<T = any>(options: any): Promise<T>;
}

export function add(client: GraphClient, data: POJO) {
  return client.http.fetch();
}

export function suggest(client: GraphClient, name: string, full: boolean) {
  return client.http.fetch();
}

export function define(client: GraphClient, options: POJO) {
  return client.http.fetch();
}

export function factory(client: GraphClient, options: any): VariablesExtension {
  return {
    add: add.bind(null, client),
    suggest: suggest.bind(null, client),
    define: define.bind(null, client),
  };
}
