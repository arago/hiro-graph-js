const $placeholder = Symbol('gremlin-placeholder');

export type GremlinQueryFunction = (
  gremlin: GremlinQueryBuilder,
) => GremlinQueryBuilder;

export type GremlinQuery = string | GremlinQueryBuilder;
export interface PlaceholderObject {
  [$placeholder]: true;
  toString: () => string;
}

export type MethodArgument =
  | string
  | boolean
  | PlaceholderObject
  | MethodArgumentArray;

interface MethodArgumentArray extends Array<MethodArgument> {}

export type GremlinBranch = (branch: GremlinQuery) => GremlinQuery;

export type MethodArgumentObject = Record<string, string>;

export type GremlinTransform = Record<string, GremlinBranch> | GremlinBranch[];

/**
 *  Create a new query builder
 */
export function gremlin(initialQuery: GremlinQuery) {
  return new GremlinQueryBuilder(initialQuery);
}

/**
 *  We export this constant T for easy/intuitive use in querys, although the strings
 *  work just the same.
 */
export const T = ['in', 'notin', 'eq', 'neq', 'lt', 'lte', 'gt', 'gte'].reduce(
  (obj, key) => {
    obj[key] = 'T.' + key;

    return obj;
  },
  {} as Record<string, string>,
);

/**
 *  Returns a string that will be used as is as a placeholder variable
 *  @TODO discover what limitations there are on placeholder strings.
 */
export const placeholder = (name: string) => {
  return {
    toString: () => name,
    [$placeholder]: true,
  };
};

/**
 *  long/float are simply helpers that add the correct suffixes to our queries
 */
export const long = (n: number) => {
  //n should be a number.
  return n + 'l';
};
export const float = (n: number) => {
  // n should be a number
  return n + 'f';
};

/**
 *  A simple gremlin query builder object.
 *
 *  Provides a convenience for having to produce the queries by hand,
 *  and escapes the terms correctly.
 */
export class GremlinQueryBuilder {
  private _stack: GremlinQuery[] = [];
  private _query: GremlinQuery | false = false;

  constructor(initialQuery?: string | GremlinQueryBuilder) {
    if (initialQuery) {
      this._stack.push(initialQuery);
      this._query = initialQuery;
    }
  }

  toString(): string {
    if (!this._query) {
      return this._stack.filter(Boolean).join('.');
    } else if (typeof this._query === 'string') {
      return this._query;
    }

    return this._query.toString();
  }

  /**
   *  Push a raw query segment onto the internal stack
   *
   *  This is used by all internal methods and adds data
   *  to the current query.
   */
  raw(query: GremlinQuery) {
    this._stack.push(query);
    this._query = false;

    return this;
  }

  /**
   *  Append to the last chunk in the stack,
   *
   *  This is used for the very rare instances where you
   *  need to add directly to the last element in the stack
   *  rather than adding a new element (which would be `.` seperated)
   *
   *  The example is a limit clause which appends `[0..1]` directly to
   *  the current pipeline.
   */
  append(query: GremlinQuery) {
    if (this._stack.length > 0) {
      const chunk = this._stack.pop();

      if (!chunk) {
        return this.raw(query);
      }

      return this.raw(chunk.toString() + query);
    } else {
      this.raw(query);
    }
  }

  /**
   *  Apply one or more transforms to the query
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#transform-1
   */
  transform(transforms: GremlinTransform) {
    let branches;
    const brancher = createBrancher('it');

    if (Array.isArray(transforms)) {
      //closure to remove the "index" argument
      branches = transforms.map((value) => brancher(value));
    } else {
      branches = Object.keys(transforms).map((key) =>
        brancher(transforms[key], key),
      );
    }

    return this.raw(`transform{[${branches.join(',')}]}`);
  }

  /**
   *  Split the pipeline into multiple (and merge back)
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#copysplit
   */
  copySplit(paths: GremlinBranch[], mergeType: string = 'fairMerge') {
    if (mergeType !== 'fairMerge' && mergeType !== 'exhaustMerge') {
      throw new Error(
        'invalid copySplit merge. should be `fairMerge` or `exhaustMerge`',
      );
    }

    const brancher = createBrancher('_()');
    const branches = paths.map((value) => brancher(value));

    return this.raw(`copySplit(${branches.join(',')}).${mergeType}`);
  }

  /**
   *  Or conditions are handle with a branching method.
   *
   *  Each condition is considered and any one pass means the
   *  object continues through the pipeline.
   *
   *  @see http://tinkerpop.apache.org/docs/3.3.1/reference/#or-step
   */
  or(conditions: GremlinBranch[]) {
    const brancher = createBrancher('__');
    const branches = conditions.map((value) => brancher(value));

    return this.raw(`or(${branches.join(',')})`);
  }

  /**
   *  Apply a deduplication filter
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#dedup
   */
  dedup(prop: string = 'ogit/_id') {
    return this.raw(`dedup{it.getProperty(${quote(prop)})}`);
  }

  /**
   *  Restrict results to a subset of the pipeline
   *
   *  NB. `start` zero based an inclusive, `finish` is absolute (not relative to start) and inclusive.
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#ij
   */
  limit(start: number, finish: number) {
    //this needs to be merged directly onto the last element of the query!
    return this.append(`[${start}..${finish}]`);
  }

  /**
   *  Re-order the pipeline
   *
   *  Note that in GraphIT almost everything is a string, so ordering is
   *  lexical. (most codecs created by {@link createCodec} respect lexical ordering)
   *
   *  @see http://tinkerpop.apache.org/docs/3.3.1/reference/#order-step
   */
  order() {
    return this.raw('order()');
  }

  /**
   * Insert "by" step-modulator
   *
   *  @see http://tinkerpop.apache.org/docs/3.3.1/reference/#by-step
   */
  by(field: string) {
    return this.raw(`by("${field}")`);
  }

  /**
   * Insert a range() statement
   *
   *  @see http://tinkerpop.apache.org/docs/3.3.1/reference/#range-step
   */
  range(from: number, to: number) {
    return this.raw(`range(${from}, ${to})`);
  }

  /**
   * Reduce the pipeline to a single property from each item.
   *
   *  @see http://tinkerpop.apache.org/docs/3.3.1/reference/#value-step
   */
  values(target: string) {
    if (!target) {
      return this.raw('values()');
    }

    return this.raw(`values("${target}")`);
  }

  /**
   *  Filter the pipeline with a closure.
   *
   *  **NB there is currently no validation of the input**
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#filter-1
   */
  filter(condition: string) {
    //NB no validation is done here!
    //perhap we could improve with
    // filter(subjectGremlinQuery, comparator, object)
    // e.g filter(_ => _.getProperty("age"), ">", 29);
    return this.raw(`filter{${condition}}`);
  }

  /**
   *  Shorthand for a transform that adds a static temporary property to each result in the pipeline
   */
  addTempProp(name: string, value: string) {
    ensureTemporaryPropNameOK(name);
    this.raw(`transform{it.${name}=${quote(value)};it}`);
  }
  /**
   *  Shorthand for a transform that adds a dynamic temporary property to each result in the pipeline
   */
  addComputedProp(name: string, query: GremlinBranch) {
    ensureTemporaryPropNameOK(name);

    const subQuery = createBrancher('it')(query);

    return this.raw(`transform{it.${name}=${subQuery};it}`);
  }

  /**
   *  Group results by given property's value
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#groupby
   */
  groupBy(groupingProp: string, resultProp?: string) {
    const prop =
      groupingProp === 'label'
        ? groupingProp
        : `getProperty(${quote(groupingProp)})`;
    const resultStanza = resultProp
      ? `it.getProperty(${quote(resultProp)})`
      : 'it';

    return this.raw(`groupBy{it.${prop}}{${resultStanza}}.cap`);
  }

  /**
   *  Count results grouped by given property's value
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#groupby
   */
  groupCount(groupingProp: string) {
    const prop =
      groupingProp === 'label'
        ? groupingProp
        : `getProperty(${quote(groupingProp)})`;

    return this.raw(`groupCount{it.${prop}}.cap`);
  }

  /**
   *  Traverse to incoming edges
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#ine
   */
  inE(...args: MethodArgument[]) {
    return this.raw(methodCall('inE', args));
  }

  /**
   *  Traverse to outbound edges
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#oute
   */
  outE(...args: MethodArgument[]) {
    return this.raw(methodCall('outE', args));
  }

  /**
   *  Traverse to edges in both directions
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#bothe
   */
  bothE(...args: MethodArgument[]) {
    return this.raw(methodCall('bothE', args));
  }

  /**
   *  Traverse to incoming vertices
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#inv
   */
  inV(...args: MethodArgument[]) {
    return this.raw(methodCall('inV', args));
  }

  /**
   *  Traverse to outbound vertices
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#outv
   */
  outV(...args: MethodArgument[]) {
    return this.raw(methodCall('outV', args));
  }

  /**
   *  Traverse to vertices in both directions
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#bothv
   */
  bothV(...args: MethodArgument[]) {
    return this.raw(methodCall('bothV', args));
  }

  /**
   *  Traverse to vertices along inbound edges
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#in
   */
  in(...args: MethodArgument[]) {
    return this.raw(methodCall('in', args));
  }
  /**
   *  Traverse to vertices along outbound edges
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#out
   */
  out(...args: MethodArgument[]) {
    return this.raw(methodCall('out', args));
  }

  /**
   *  Traverse to vertices along edges in either direction
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#both
   */
  both(...args: MethodArgument[]) {
    return this.raw(methodCall('both', args));
  }

  /**
   *  Count the results in the pipeline
   */
  count(...args: MethodArgument[]) {
    return this.raw(methodCall('count', args));
  }

  /**
   *  Mark a pipeline position for later back-filtering
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#as
   */
  as(...args: MethodArgument[]) {
    return this.raw(methodCall('as', args));
  }

  /**
   *  Back-filter to a named step or by a number of steps.
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#back
   */
  back(...args: MethodArgument[]) {
    return this.raw(methodCall('back', args));
  }

  /**
   *  Randomize pipeline output order
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#shuffle
   */
  shuffle(...args: MethodArgument[]) {
    return this.raw(methodCall('shuffle', args));
  }

  /**
   *  Filter the pipeline to object which match the pattern
   *
   *  The argument here can be an object of "prop" => "value" (which you
   *  can encode with a {@see Codec})
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#has
   */
  has(...args: MethodArgumentObject[] | MethodArgument[]) {
    return objectMethodCall(this, 'has', args);
  }

  /**
   *  Filter the pipeline to object which **don't** match the pattern
   *
   *  The argument here can be an object of "prop" => "value" (which you
   *  can encode with a {@see Codec})
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#hasnot
   */
  hasNot(...args: MethodArgumentObject[] | MethodArgument[]) {
    return objectMethodCall(this, 'hasNot', args);
  }

  /**
   *  Calls the `tree` side-effect grouping all traversed edges/vertices.
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#tree
   */
  tree() {
    return this.raw('tree.cap');
  }

  /**
   *  Reduce the pipeline to a single property from each item.
   *
   *  NB not to be confused with `getProperty` that acts on a single
   *  pipeline element.
   *
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#property
   */
  property(...args: MethodArgument[]) {
    return this.raw(methodCall('property', args));
  }

  /**
   *  Pluck a property value from a pipeline element, i.e. in a closure
   *  NB not to be confused with `.property(name)` which reduces a pipeline
   *  itself to a stream of property values
   *
   *  @see http://gremlindocs.spmallette.documentup.com/#key
   */
  getProperty(...args: MethodArgument[]) {
    return this.raw(methodCall('getProperty', args));
  }
}

//helper to validate temporary property name
const ensureTemporaryPropNameOK = (name: string) => {
  if (name.indexOf('$_') !== 0) {
    throw new Error(
      `Gremlin temporary properties must start with $_, given: ${name}`,
    );
  }
};

//creates a branched structure with subQueries
const createBrancher = (prefix: string) => (
  value: GremlinBranch,
  key?: string,
) => {
  const subQuery = new GremlinQueryBuilder(prefix);

  //if a string, assume a fixed query
  if (typeof value === 'string') {
    subQuery.raw(value);
  } else {
    value(subQuery);
  }

  return (key ? key + ':' : '') + subQuery;
};

//quote a value for use in a gremlin function argument.
const quote = (value: string) =>
  `"${value.replace(/"/g, `\\"`).replace(/\$/g, `\\$`)}"`;

const isPlaceholder = (arg?: MethodArgument): arg is PlaceholderObject => {
  if (typeof arg !== 'object') {
    return false;
  }

  if (Array.isArray(arg)) {
    return false;
  }

  return arg[$placeholder];
};

const formatArgs = (args: MethodArgument[]): string[] =>
  args.map((value) => {
    if (value === true || value === false) {
      //don't quote;
      return value ? 'true' : 'false';
    }

    if (Array.isArray(value)) {
      //OK, an array of values need quoting and adding surrounded by
      //square brackets

      return formatArgs(value).join(',');
    }

    // check if this is a placeholder object
    if (isPlaceholder(value)) {
      return value.toString(); // raw value for placeholder
    }

    //after this cast to string
    const str = '' + value;

    if (/^T\.[a-z]+/.test(str)) {
      //this is an identifier used for comparison operators.
      //do not quote.
      return str;
    }

    if (/^[0-9]+(\.[0-9]*)?[lf]?$/.test(str)) {
      //this is a java int/long/float, return as is.
      //NB this is not the only way to denote this, but
      //the only format *we* accept.
      return str;
    }

    //otherwise just quote.
    return quote(str);
  });

//a simple method call to string.
const methodCall = (method: string, args: MethodArgument[] = []) => {
  return `${method}(${formatArgs(args).join(',')})`;
};

const objectMethodCall = (
  instance: GremlinQueryBuilder,
  method: string,
  args: MethodArgumentObject[] | MethodArgument[] = [],
) => {
  const first = args[0] as MethodArgumentObject;

  if (typeof first === 'object') {
    Object.keys(first).forEach((key) => {
      //only single arguments in this form.
      instance.raw(methodCall(method, [key, first[key]]));
    });

    return instance;
  }

  return instance.raw(methodCall(method, args as MethodArgument[]));
};
