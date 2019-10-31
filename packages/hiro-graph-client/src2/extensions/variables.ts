import { Client, POJO } from '../types';

export interface VariablesExtension {
  // TODO: define Variable interface
  add<T = any>(data: any): Promise<T>;

  suggest<T = any>(name: string, full: boolean, ...args: any[]): Promise<T>;

  define<T = any>(options: any): Promise<T>;
}

export function add(client: Client, variable: POJO) {
  return client.http.fetch();
}

export function suggest(client: Client, variable: POJO) {
  return client.http.fetch();
}

export function define(client: Client, variable: POJO) {
  return client.http.fetch();
}

export function Factory(client: Client, options: any): VariablesExtension {
  return {
    add: add.bind(null, client),
    suggest: suggest.bind(null, client),
    define: define.bind(null, client),
  };
}
