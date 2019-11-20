/**
 *  Schema aware Lucene Wrapper
 */
const OP_NOT = '-';
const OP_MUST = '+';
const OP_CAN = '';

/**
 *  The lucene class takes a Schema and creates a query parser.
 *
 *  It can be used without the Schema, and then it "identity" encodes all values/property names.
 *
 *  This is super powerful, the guide to all the syntax options is in the documentation
 *  for the {@link LuceneQuery} type.
 *
 *  @param {?LuceneQuery} query - the query to parse
 *  @param {?Entity} entity - an optional schema entity to use to translate the keys and values
 *  @return {{ querystring: string, placeholders: object }} - the return value contains the string to be used
 *          as the query body and the placeholders to go with it (if any)
 */
export default function createLuceneQuerystring(
    query = {},
    entity = nativeEntity, // the nativeEntity does no mapping of prop names, or encoding of values
) {
    return convertLuceneQuery(entity, query);
}
/**
 * Create a placeholder key
 */
const createPlaceholder = (placeholders, term) => {
    placeholders.push(term);

    return placeholderAliasInQuery(placeholders.length - 1);
};

const placeholderAliasInQuery = (i) => `$ph_${i}`;
const placeholderKeyInRequest = (i) => `ph_${i}`;

// this is only exported to all for use in testing
export const getPlaceholderKeyForIndex = placeholderKeyInRequest;

/**
 *  The initial context object for the query building
 */
const initialContext = (entity) => {
    return {
        querystring: '',
        placeholders: [],
        op: OP_MUST,
        entity,
    };
};

/**
 *  This is a helper for this lib if you want to use it without the ORM property mappings.
 */
const nativeEntity = {
    internal: true,
    prop: (name) => {
        const transform = /^ogit\/_/.test(name) ? (x) => x : (x) => '' + x;

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
function convertLuceneQuery(entity, query) {
    const context = initialContext(entity);
    const querystring = createQuerySegment(context, normaliseQuery(query));
    const parsed = {
        querystring,
        placeholders: context.placeholders.reduce(
            (opts, placeholder, index) => {
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
const ensureArray = (value) => {
    return Array.isArray(value) ? value : [value];
};

//the "$" keys which do not recurse
const noRecurseKeys = ['$search', '$range', '$missing'];

//forces all properties to be arrays.
//knows how to recurse and when not to.
const normaliseQuery = (queryObject, isAnyOperator = false) => {
    return Object.keys(queryObject).map((key) => {
        const value = queryObject[key];

        if (key[0] === '$' && noRecurseKeys.indexOf(key) === -1) {
            //we should recurse
            return { key, values: normaliseQuery(value, true) };
        }

        if (key.match(/\.ngram$/)) {
            // ngram search doesn't work with quoted phrases, like a "Single value", "Run machine".
            // Because of that we need to split our value by whitespace
            if (!Array.isArray(value)) {
                return { key, values: value.split(' '), isAnyOperator };
            } else {
                const values = value.reduce(
                    (acc, val) => acc.concat(val.split(' ')),
                    [],
                );

                return { key, values, isAnyOperator };
            }
        }

        return { key, values: ensureArray(value), isAnyOperator };
    });
};

/**
 *  This is the recursive part that constructs the querystring from the
 *  query given.
 */
function createQuerySegment(context, query, isPlaceholdersNeeded = false) {
    // console.log("segment", query);
    return query
        .map(({ key, values, isAnyOperator }) => {
            //always make value an array
            if (key[0] === '$') {
                //special case!
                return operators[key](context, values);
            }

            if (!isAnyOperator && values.length > 1) {
                return createQuerySegmentForMultiValues(context, key, values);
            }

            //default prop => values
            return luceneTerm(context, key, values, isPlaceholdersNeeded);
        })
        .join(' ');
}

//helper to flatten an array of arrays
//const doubleFlatten = arrayOfArrays => arrayOfArrays.map().join(" ");

// create segment with OR rule if we have array of values without any operator
const createQuerySegmentForMultiValues = (context, key, values) =>
    `+(${values
        .map(checkTermForQuoting)
        .map((term) => `${slashForward(key)}:${term}`)
        .join(' ')})`;

// TODO: add placeholders replacement after fixing BE issues according to escaping

/**
 *  So all of the "special" props are held here with how they work.
 */

const operators = {
    //simple negation
    $not: (context, values) => mapOperator(context, OP_NOT, values),

    //simple boolean or
    $or: (context, values) => mapOperator(context, OP_CAN, values),

    //simple boolean and
    $must: (context, values) => mapOperator(context, OP_MUST, values),
    $and: (context, values) => mapOperator(context, OP_MUST, values),

    /**
     *  lucene field missing
     *  { $missing: "field" }, or { $missing: [ "field", "second" ] }
     */
    $missing: (context, values) =>
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
     *  { $search: { field = "_content.ngram", term = "" }, or { $search: "term" } (searches _content.ngram)
     */
    $search: (context, values) => {
        return values
            .reduce((acc, searchInput) => {
                let search = searchInput;

                if (typeof search === 'string') {
                    //default search type.
                    search = { type: 'ngram', term: search };
                }

                if (!search.field) {
                    search.field = '_content';
                }

                if (search.type === 'prefix') {
                    //this is terrible for multi-word searches.
                    return acc.concat(
                        lucenePrefixMatch(context, search.field, search.term),
                    );
                }

                //we always return an array
                return acc.concat(
                    luceneSearch(context, search.field, search.term, {
                        ngram: search.type === 'ngram',
                    }),
                );
            }, [])
            .join(' ');
    },
};

//maps the values with the given operator as a sub segment
const mapOperator = (context, op, values) => {
    //console.log("mapOperator", context, op, values);
    const currentOp = context.op;
    //we need to change the the op to MUST if they requested CAN but there is only one option.
    //So we need to recurse and count
    const nextOp =
        values.length === 1 && values[0].values.length === 1 && op === OP_CAN
            ? OP_MUST
            : op;

    //set the inner context's op
    context.op = nextOp;

    const segment = `${currentOp}(${createQuerySegment(
        context,
        values,
        true,
    )})`;

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
const quote = function(string) {
    return `"${slashString(string)}"`;
};

const SOLIDUS = '/';
const SLASH = '\\'; // two because it has to be escaped.
const QUOTE = `"`;

const slashForward = (input) => input.replace(/[/]/g, SLASH + SOLIDUS);

// this escapes quotes and slashes
const slashString = (input) => input.replace(/[\\"]/g, (char) => SLASH + char);

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
const findQuotedTerms = function(str) {
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
            if (
                (!inQuoted && char === ' ') ||
                (inQuoted && char === inQuoted)
            ) {
                terms.push(term);
                term = '';
                inTerm = false;
            } else if (
                inQuoted &&
                char === SLASH &&
                input[i + 1] === inQuoted
            ) {
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

function checkTermForQuoting(term) {
    return typeof term === 'string' ? quote(term) : term;
}
//create a term query with an operator and many possible values.
function luceneTerm(context, field, values, isPlaceholdersNeeded) {
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
function luceneRange(context, field, lower, higher) {
    const prop = context.entity.prop(field);
    const [low, high] = [lower, higher]
        .map(prop.encode)
        .map(checkTermForQuoting);

    return `${context.op}${slashForward(prop.src)}:[${low} TO ${high}]`;
}

//create a _missing_ query
function luceneMissing(context, field) {
    const prop = context.entity.prop(field);

    return `${context.op}_missing_:${quote(prop.src)}`;
}

//create a search query, this is a little different to a regular term
//because we assume a phrase and we use placeholders for values.
function luceneSearch(context, field, term, { ngram = false } = {}) {
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
function lucenePrefixMatch(context, field, term) {
    const prop = context.entity.prop(field);
    const finalTerm = slashString(term).replace(/ /g, '?') + '*';
    const placeholder = createPlaceholder(context.placeholders, finalTerm);

    return `${context.op}${slashForward(prop.src)}:${placeholder}`;
}
