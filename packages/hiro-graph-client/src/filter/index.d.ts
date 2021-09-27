import { EventStreamResponse } from '..';

export class Attribute {
  present(): Filter;
  any(): Filter;
  raw(value: string): Filter;
  equalTo(name: string): Filter;
  endsWith(name: string): Filter;
  startsWith(name: string): Filter;
  contains(name: string): Filter;
  approx(name: string): Filter;
  lte(name: string): Filter;
  gte(name: string): Filter;
  escape(name: string): Filter;
}

export class Group {
  match: (data: object) => boolean;
  toString: () => string;
}

export class Filter {
  static attribute(name: string): Attribute;
  static AND(filters: (Filter | Group)[]): Group;
  static OR(filters: (Filter | Group)[]): Group;
  static NOT(filters: (Filter | Group)[]): Group;
  static matchString(
    value: string | string[],
    filters: (Filter | Group)[],
  ): Group;
  static matchSubstring(
    value: string | string[],
    filters: (Filter | Group)[],
  ): Group;
  static matchLTE(value: string | string[], filters: (Filter | Group)[]): Group;
  static matchGTE(value: string | string[], filters: (Filter | Group)[]): Group;

  static transformEvent(event: Partial<EventStreamResponse<any>>): any;

  match: (data: object) => boolean;
  simplify: () => Filter;
  toString: () => string;
}

export function parseFilter(input: string): Filter;
