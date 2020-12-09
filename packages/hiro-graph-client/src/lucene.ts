export declare namespace Lucene {
  export type QueryOperator<T extends string> =
    | '$not'
    | '$or'
    | '$must'
    | '$and'
    | '$missing'
    | T;

  export type BaseQuery<T extends string> = {
    [K in QueryOperator<T>]?: string | string[] | BaseQuery<T>;
  };

  export interface AnyQuery {
    [index: string]: string | string[] | AnyQuery;
  }

  export type SearchQuery =
    | {
        type: 'ngram' | 'prefix';
        term: string;
        field?: string;
      }
    | string;

  export interface RangeQuery {
    [index: string]: [number, number];
  }

  export type QueryOption<T extends string> =
    | undefined
    | AnyQuery
    | string
    | string[]
    | BaseQuery<T>
    | SearchQuery
    | RangeQuery
    | Query<T>;

  export interface Query<T extends string = string> {
    $search?: SearchQuery;
    $range?: RangeQuery;
    $not?: string | string[] | BaseQuery<T>;
    $or?: string | string[] | BaseQuery<T>;
    $must?: string | string[] | BaseQuery<T>;
    $and?: string | string[] | BaseQuery<T>;
    $missing?: string | string[] | BaseQuery<T>;
    T?: string | string[] | BaseQuery<T>;
    [index: string]: QueryOption<T>;
  }

  export interface Value {
    querystring: string;
    placeholders: Record<string, Placeholder>;
  }

  export interface BaseEntity {
    internal?: boolean;
    name?: string;
    prop: (
      name: string,
    ) => {
      src: string;
      dst: string;
      encode: (x: any) => any;
      decode: (x: any) => any;
    };
  }

  export interface InternalEntity extends BaseEntity {
    internal: true;
  }

  export interface ExternalEntity extends BaseEntity {
    internal: false | undefined;
    ogit: string;
  }

  export type Entity = InternalEntity | ExternalEntity;

  export interface Placeholder {}

  export interface Context {
    querystring: string;
    placeholders: Placeholder[];
    op: string;
    entity: InternalEntity | ExternalEntity;
  }
}

export interface LuceneQueryOptions {
  limit?: number;
  offset?: number;
  order?: string | string[];
  fields?: string[];
  count?: boolean;
  [index: string]: any;
}

type NormalisedQuery = {
  key: string;
  values: (string | NormalisedQuery)[];
  isAnyOperator?: boolean;
};
type NormalisedQueryValues = NormalisedQuery['values'];

/**
 *  Schema aware Lucene Wrapper
 */

enum OP {
  NOT = '-',
  MUST = '+',
  CAN = '',
}

/**
 *  The lucene class takes a Schema and creates a query parser.
 *
 *  It can be used without the Schema, and then it "identity" encodes all values/property names.
 *
 *  This is super powerful, the guide to all the syntax options is in the documentation
 *  for the {@link LuceneQuery} type.
 */
export function lucene<T extends string = string>(
  query: Lucene.Query<T> = {},
  entity: Lucene.Entity = nativeEntity, // the nativeEntity does no mapping of prop names, or encoding of values
) {
  return convertLuceneQuery<T>(entity, query);
}
/**
 * Create a placeholder key
 */
const createPlaceholder = (
  placeholders: Lucene.Placeholder[],
  term: Lucene.Placeholder,
) => {
  placeholders.push(term);

  return placeholderAliasInQuery(placeholders.length - 1);
};

const placeholderAliasInQuery = (i: number) => `$ph_${i}`;
const placeholderKeyInRequest = (i: number) => `ph_${i}`;

// this is only exported to all for use in testing
export const getPlaceholderKeyForIndex = placeholderKeyInRequest;

/**
 *  The initial context object for the query building
 */
const initialContext = (entity: Lucene.Entity): Lucene.Context => {
  return {
    querystring: '',
    placeholders: [],
    op: OP.MUST,
    entity,
  };
};

/**
 *  This is a helper for this lib if you want to use it without the ORM property mappings.
 */
const nativeEntity: Lucene.Entity = {
  internal: true,
  prop: (name: string) => {
    const transform = /^ogit\/_/.test(name)
      ? (x: string) => x
      : (x: string) => '' + x;

    return {
      src: name,
      dst: name,
      encode: transform,
      decode: transform,
    };
  },
};

/**
 * using the entity given, map the query object to a Lucene query string + placeholders.
 */
function convertLuceneQuery<T extends string>(
  entity: Lucene.Entity,
  query: Lucene.Query<T>,
) {
  const context = initialContext(entity);
  const querystring = createQuerySegment(context, normaliseQuery<T>(query));

  const parsed: Lucene.Value = {
    querystring,
    placeholders: context.placeholders.reduce(
      (opts: Lucene.Value['placeholders'], placeholder, index) => {
        opts[placeholderKeyInRequest(index)] = placeholder;

        return opts;
      },
      {},
    ),
  };

  if (!entity.internal) {
    //this is not an internal-only entity (i.e. a fake one that just translates
    // ogit internal attributes. This means we should insert a "ogit/_type" filter.
    parsed.querystring = `+${slashForward('ogit/_type')}:${quote(
      entity.ogit,
    )} ${parsed.querystring}`;
  }

  return parsed;
}

//turns a single value into an array if not already
const ensureArray = (value: any | any[]) => {
  return Array.isArray(value) ? value : [value];
};

//the "$" keys which do not recurse
const noRecurseKeys = ['$search', '$range', '$missing'];

// split value into ngrams min length 2, max length 10
const ngramChunker = (value: string) => value.match(/.{2,10}/g) || [];

const ngramArray = (values: string[]) =>
  values
    .reduce(
      (acc, val) => [...acc, ...val.split(/[^a-zA-Z0-9]/)],
      [] as string[],
    )
    .filter(Boolean);

const isQuery = <T extends string>(
  key: string,
  value: Lucene.QueryOption<T>,
): value is Lucene.Query<T> =>
  key[0] === '$' && noRecurseKeys.indexOf(key) === -1;

const isNgram = <T extends string>(
  key: string,
  value: Lucene.QueryOption<T>,
): value is string => !!key.match(/\.ngram$/);

//forces all properties to be arrays.
//knows how to recurse and when not to.
const normaliseQuery = <T extends string>(
  queryObject: Lucene.Query<T>,
  isAnyOperator: boolean = false,
): NormalisedQuery[] => {
  return Object.keys(queryObject).map((key) => {
    const value = queryObject[key];

    if (isQuery(key, value)) {
      //we should recurse
      return { key, values: normaliseQuery(value, true) };
    }

    let values = ensureArray(value);

    if (isNgram(key, value)) {
      // ngram search doesn't work with quoted phrases, like a "Single value", "Run machine".
      // Because of that we need to split our value by non-alphanumeric characters
      values = ngramArray(values);

      let isMultiDepth = values.reduce(
        (acc, val) => acc || val.length > 10,
        false,
      );

      if (isMultiDepth) {
        const subQuery = values.reduce((acc, val) => {
          const newValues = ngramChunker(val);

          if (newValues.length > 1) {
            acc.$and = { [key]: newValues };

            return { $or: acc };
          }

          if (newValues.length === 1) {
            acc.$or = acc.$or || { [key]: [] };
            acc.$or[key].push(newValues[0]);
          }

          return acc;
        }, {});

        return { key: '$or', values: normaliseQuery(subQuery, true) };
      }
    }

    return { key, values, isAnyOperator };
  });
};

/**
 *  This is the recursive part that constructs the querystring from the
 *  query given.
 */
function createQuerySegment(
  context: Lucene.Context,
  query: NormalisedQuery[],
  isPlaceholdersNeeded: boolean = false,
) {
  // console.log("segment", query);
  return query
    .map(({ key, values, isAnyOperator }) => {
      //always make value an array
      if (key[0] === '$') {
        //special case!
        return operators[key](context, values as NormalisedQuery[]);
      }

      if (!isAnyOperator && values.length > 1) {
        return createQuerySegmentForMultiValues(
          context,
          key,
          values as string[],
        );
      }

      //default prop => values
      return luceneTerm(context, key, values, isPlaceholdersNeeded);
    })
    .join(' ');
}

//helper to flatten an array of arrays
//const doubleFlatten = arrayOfArrays => arrayOfArrays.map().join(" ");

// create segment with OR rule if we have array of values without any operator
const createQuerySegmentForMultiValues = (
  context: Lucene.Context,
  key: string,
  values: string[],
) =>
  `+(${values
    .map(checkTermForQuoting)
    .map((term) => `${slashForward(key)}:${term}`)
    .join(' ')})`;

// TODO: add placeholders replacement after fixing BE issues according to escaping

/**
 *  So all of the "special" props are held here with how they work.
 */

type Operators = Record<
  string,
  (context: Lucene.Context, values: any[]) => any
>;

const operators: Operators = {
  //simple negation
  $not: (context, values) => mapOperator(context, OP.NOT, values),

  //simple boolean or
  $or: (context, values) => mapOperator(context, OP.CAN, values),

  //simple boolean and
  $must: (context, values) => mapOperator(context, OP.MUST, values),
  $and: (context, values) => mapOperator(context, OP.MUST, values),

  /**
   *  lucene field missing
   *  { $missing: "field" }, or { $missing: [ "field", "second" ] }
   */
  $missing: (context, values: string[]) =>
    values.map((field) => luceneMissing(context, field)).join(' '),

  /**
   *  lucene range operator
   *  { $range: { "prop": [ from, to ] }
   */
  $range: (context, values) => {
    return values
      .reduce(
        (acc, object) =>
          acc.concat(
            Object.keys(object).map((field) => {
              const [lower, higher] = object[field];

              return luceneRange(context, field, lower, higher);
            }),
          ),
        [],
      )
      .join(' ');
  },
  /**
   *  Search.
   *  { $search: "term" } (searches ogit/_content.ngram)
   */
  $search: (context, values) =>
    createQuerySegmentForMultiValues(
      context,
      'ogit/_content.ngram',
      values as string[],
    ),
};

const isNormalisedValue = (values: any): values is NormalisedQuery[] =>
  values.length === 1 && values[0].values.length === 1;

//maps the values with the given operator as a sub segment
const mapOperator = (
  context: Lucene.Context,
  op: OP,
  values: NormalisedQuery[],
) => {
  //console.log("mapOperator", context, op, values);
  const currentOp = context.op;
  //we need to change the the op to MUST if they requested CAN but there is only one option.
  //So we need to recurse and count
  const nextOp = isNormalisedValue(values) && op === OP.CAN ? OP.MUST : op;

  //set the inner context's op
  context.op = nextOp;

  const segment = `${currentOp}(${createQuerySegment(context, values, true)})`;

  //return the context's op to the previous
  context.op = currentOp;

  return segment;
};

/**
 *  lucene query pieces
 */

//Quotes a string with double-quotes, escaping existing doubles.
// we need to make sure this handles:
// help" -> "help\""
// help \" -> "help \\\""
// help \ -> "help \\"
const quote = function (string: string) {
  return `"${slashString(string)}"`;
};

const SOLIDUS = '/';
const SLASH = '\\'; // two because it has to be escaped.
const QUOTE = `"`;

const slashForward = (input: string) => input.replace(/[/]/g, SLASH + SOLIDUS);

// this escapes quotes and slashes
const slashString = (input: string) =>
  input.replace(/[\\"]/g, (char: string) => SLASH + char);

//run through the term string and pull out terms.
//if there are any quotes, this becomes complex...
//so we use iteration and state rather than regexes
//This function removes the quotes around the terms as well.
/*
    examples:

    'test terms' => ["test", "terms"]
    'test "two words"' => ["test", "two words"]
    '"test unclosed' => ["\"test unclosed"]
    '"test one" two "test three"' => ["test one", "two", "test three"]
    'something"with a quote' => ["something\"with", "a", "quote"]
    '"with \"embedded\" quotes"' => ["with \"embedded\" quotes"]
*/
const findQuotedTerms = function (str: string) {
  const input = str.trim(); //ensure no trailing space.
  const terms = [];
  const l = input.length;
  let i = 0;
  let inQuoted = '';
  let inTerm = false;
  let term = '';
  let char;

  for (; i < l; i++) {
    char = input[i];

    if (inTerm) {
      if ((!inQuoted && char === ' ') || (inQuoted && char === inQuoted)) {
        terms.push(term);
        term = '';
        inTerm = false;
      } else if (inQuoted && char === SLASH && input[i + 1] === inQuoted) {
        //escaped quote
        term += SLASH + inQuoted;
        i++; //bump forwards
      } else {
        term += char;
      }
    } else if (char !== ' ') {
      //ignore spaces between terms.
      if (char === QUOTE || char === "'") {
        inQuoted = char;
      } else {
        inQuoted = '';
        term = char;
      }

      inTerm = true;
    }
  }

  //flush remaining term
  terms.push(term);

  //remove empties from output;
  return terms.filter(Boolean);
};

function checkTermForQuoting(term: string) {
  return typeof term === 'string' ? quote(term) : term;
}
//create a term query with an operator and many possible values.
function luceneTerm(
  context: Lucene.Context,
  field: string,
  values: NormalisedQueryValues,
  isPlaceholdersNeeded: boolean,
) {
  // TODO: remove force reassign after fixing BE issues according to escaping
  // eslint-disable-next-line no-param-reassign
  isPlaceholdersNeeded = false;

  const prop = context.entity.prop(field);

  if (!prop) {
    throw new TypeError(
      `Cannot find '${field}' of type '${context.entity.name}'`,
    );
  }

  return values
    .map(prop.encode) // encode for graphit with our mapping
    .map(checkTermForQuoting)
    .map((term) =>
      isPlaceholdersNeeded
        ? createPlaceholder(context.placeholders, slashString(term))
        : term,
    ) // add placeholders only for $and, $or, $must, $not sections for preventing breaking changes
    .map((term) =>
      term === null
        ? luceneMissing(context, field) //if term is null, that means the field should be missing.
        : `${context.op}${slashForward(prop.src)}:${term}`,
    ) //create querystring
    .join(' '); //join terms
}

//create a range query term
function luceneRange(
  context: Lucene.Context,
  field: string,
  lower: number,
  higher: number,
) {
  const prop = context.entity.prop(field);
  const [low, high] = [lower, higher].map(prop.encode).map(checkTermForQuoting);

  return `${context.op}${slashForward(prop.src)}:[${low} TO ${high}]`;
}

//create a _missing_ query
function luceneMissing(context: Lucene.Context, field: string) {
  const prop = context.entity.prop(field);

  return `${context.op}_missing_:${quote(prop.src)}`;
}

//create a search query, this is a little different to a regular term
//because we assume a phrase and we use placeholders for values.
function luceneSearch(
  context: Lucene.Context,
  field: string,
  term: string,
  { ngram = false } = {},
) {
  const prop = context.entity.prop(field);
  let terms;

  if (term.indexOf(`"`) > -1 || term.indexOf("'") > -1) {
    //much more complex, but keeps spaces in quotes, and quoted quotes.
    terms = findQuotedTerms(term);
  } else {
    //simple split
    terms = term.split(/\s+/);
  }

  const finalTerm = terms.filter(Boolean).join(' ');
  //now make a placeholder for the term
  const placeholder = createPlaceholder(
    context.placeholders,
    slashString(finalTerm),
  );

  return `${context.op}${slashForward(prop.src)}${
    ngram ? '.ngram' : ''
  }:${placeholder}`;
}

//lucene is not good at prefixes when spaces are encountered.
//the least bad solution is to use "?" for the spaces.
//first escape the string (but don't add quotes)
//then replace space with question mark, then add the final asterisk
function lucenePrefixMatch(
  context: Lucene.Context,
  field: string,
  term: string,
) {
  const prop = context.entity.prop(field);
  const finalTerm = slashString(term).replace(/ /g, '?') + '*';
  const placeholder = createPlaceholder(context.placeholders, finalTerm);

  return `${context.op}${slashForward(prop.src)}:${placeholder}`;
}
