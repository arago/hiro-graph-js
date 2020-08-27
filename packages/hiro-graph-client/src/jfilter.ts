import memoize from 'lodash/memoize';
import omit from 'lodash/omit';

export interface JFilterType {
  toString: () => string;
  test: (obj: any) => boolean;
}

class BaseFilter {
  protected readonly filters: JFilterType[] = [];

  constructor(filters: JFilterType[]) {
    this.filters = filters;
  }
}

class JFilterOR extends BaseFilter implements JFilterType {
  toString() {
    return `|${this.filters.map(wrapParens).join('')}`;
  }

  test(obj: any) {
    return this.filters.some((f: JFilterType) => f.test(obj));
  }
}

class JFilterAND extends BaseFilter implements JFilterType {
  toString() {
    return `&${this.filters.map(wrapParens).join('')}`;
  }

  test(obj: any) {
    return this.filters.every((f: JFilterType) => f.test(obj));
  }
}

class JFilterEQ extends BaseFilter implements JFilterType {
  private readonly prop: any;
  private readonly value: any;

  constructor(prop: any, value: any) {
    super([]);
    this.prop = prop;
    this.value = value;
  }

  toString() {
    return `(${this.prop}=${this.value})`;
  }

  test(obj: any) {
    return matches(obj, this.prop, this.value);
  }
}

class JFilter {
  static or(...filters: any): JFilterType {
    return new JFilterOR(filters);
  }

  static and(...filters: any): JFilterType {
    return new JFilterAND(filters);
  }

  static equals(prop: any, value: any): JFilterType {
    return new JFilterEQ(prop, value);
  }

  static transform(event: any) {
    return omit(
      {
        ...event,
        element: event.body,
        action: event.type,
      },
      ['body', 'type'],
    );
  }
}

const getMemoizedMatcher = memoize((value) => {
  if (!value.includes('*') && !value.includes('?')) {
    return (actual: any) => actual === value;
  }

  const processed = value
    .split(/([?*])/)
    .map((chunk: any, i: any) => {
      if (i % 2) {
        return `.${chunk === '?' ? '{1}' : '{1,}'}`;
      }

      return escapeRegexOperators(chunk);
    })
    .join('');

  const regex = new RegExp(`^${processed}$`);

  return (actual: any) => regex.test(actual);
});

function escapeRegexOperators(str: any) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getProp(obj: any, propString: any) {
  const keys = propString.split('.');

  return keys.reduce((o: any, k: any) => {
    if (typeof o === 'object' && k in o) {
      return o[k];
    }

    return false;
  }, obj);
}

function wrapParens(filter: any) {
  const inner = filter.toString();

  return inner[0] === '(' ? inner : `(${inner})`;
}

function matches(obj: any, prop: any, value: any) {
  const actual = getProp(obj, prop);
  const matcher = getMemoizedMatcher(value);

  return matcher(actual);
}

/*
  Exports
 */
export { JFilter };
