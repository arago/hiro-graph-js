/**
 *  Schema aware Gremlin wrapper.
 */
import { gremlin } from "../context/graph";

//This is a placeholder until "parse" is designed and implemented
/**
 *  @ignore - no docs.
 */
export default function parseGremlin(/*query = {}, entity*/) {
    throw new Error(
        "@TODO: need to figure out a good API for schema aware gremlin queries. Then we can implement"
    );
    //Not sure this is needed with entity.encode();
}

/**
 *  Create a new query builder
 *
 *  @param {string|GremlinQueryBuilder} initialQuery - a starting point query
 *  @param {Context} context - a {@link Context} object, allowing this gremlin query to `execute` itself.
 *  @return {GremlinQueryBuilder} - a new query builder
 */
export function queryBuilder(initialQuery, context) {
    return new GremlinQueryBuilder(initialQuery, context);
}

/**
 *  A simple gremlin query builder object.
 *
 *  Provides a convenience for having to produce the queries by hand,
 *  and escapes the terms correctly.
 */
export class GremlinQueryBuilder {
    /**
     *  @param GremlinQueryBuilder} initialQuery - An initial query to base this one on.
     *  @param {?Context} context - a {@link Context} object, allowing this gremlin query to `execute` itself.
     *  @return {GremlinQueryBuilder} - a new query builder
     */
    constructor(initialQuery = false, context) {
        this._ctx = context;
        this._stack = [];
        this._query = false;
        if (initialQuery) {
            this._stack.push(initialQuery);
            this._query = initialQuery;
        }
    }

    /**
     * Execute a gremlin query against the internal context.
     *
     * Will throw an error if no context is present on this instance
     *
     *  @param {string} rootVertexId - the Root vertex to initiate this query
     *  @param {object} [options={}] - further options to pass to the GraphIT connection
     *  @retruen {Promise<any>} - A promise for the results, which could be anything
     */
    execute(rootVertexId, options = {}) {
        return gremlin(this._ctx, rootVertexId, this.toString(), options);
    }

    /**
     *  Execute the query in the given context
     *
     *  Similiar to `.execute` but uses the give context, not the internal one.
     *
     *  @param {Context} ctx - the Graph Context to use for this query
     *  @param {string} rootVertexId - the Root vertex to initiate this query
     *  @param {object} [options={}] - further options to pass to the GraphIT connection
     *  @retruen {Promise<any>} - A promise for the results, which could be anything
     */
    executeInContext(ctx, rootVertexId, options = {}) {
        return gremlin(ctx, rootVertexId, this.toString(), options);
    }

    /**
     *  Query along a Schema-defined Relation
     *
     *  @param {string} type - the Schema type name for the entity the relation belongs to
     *  @param {Array<string>} relations - the names of the relations to generate a gremlin query for
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    relation(type, relations) {
        if (!this._ctx) {
            throw new Error("Cannot use gremlin `relation` without context");
        }
        return this._ctx[type].relationQuery(relations)(this);
    }

    /**
     * Turns the query into a string to send to GraphIT
     *
     * We cache the string form, so you *must* always use "raw" to update the stack
     * even from inside the class methods.
     *
     *  @return {string} the string representation of the query
     */
    toString() {
        if (this._query === false) {
            this._query = this._stack.filter(Boolean).join(".");
        }
        return this._query;
    }

    /**
     *  Push a raw query segment onto the internal stack
     *
     *  This is used by all internal methods and adds data
     *  to the current query.
     *
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    raw(query) {
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
     *
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    append(query) {
        const chunk = this._stack.pop() + query;
        return this.raw(chunk);
    }

    /**
     *  Apply one or more transforms to the query
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#transform-1
     *
     *  @param {object.<string, GremlinBranch>|Array<GremlinBranch>} transforms - the transformations to make
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    transform(transforms) {
        let branches;
        const brancher = createBrancher("it", this._ctx);
        if (Array.isArray(transforms)) {
            //closure to remove the "index" argument
            branches = transforms.map(value => brancher(value));
        } else {
            branches = Object.keys(transforms).map(key =>
                brancher(transforms[key], key)
            );
        }
        return this.raw(`transform{[${branches.join(",")}]}`);
    }

    /**
     *  Split the pipeline into multiple (and merge back)
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#copysplit
     *
     *  @param {Array<GremlinBranch>} paths - the transformations to make
     *  @param {string} [mergeType=fairMerge] - the method of merging the results.
                            either `fairMerge` which is one of each branch in turn
                            or `exhaustMerge` which exhausts each branch in turn
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    copySplit(paths, mergeType = "fairMerge") {
        if (mergeType !== "fairMerge" && mergeType !== "exhaustMerge") {
            throw new Error(
                "invalid copySplit merge. should be `fairMerge` or `exhaustMerge`"
            );
        }
        const brancher = createBrancher("_()", this._ctx);
        const branches = paths.map(value => brancher(value));
        return this.raw(`copySplit(${branches.join(",")}).${mergeType}`);
    }

    /**
     *  Or conditions are handle with a branching method.
     *
     *  Each condition is considered and any one pass means the
     *  object continues through the pipeline.
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#or
     *
     *  @param {Array<GremlinBranch>} conditions - the array of possible conditions
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    or(conditions) {
        const brancher = createBrancher("_()", this._ctx);
        const branches = conditions.map(value => brancher(value));
        return this.raw(`or(${branches.join(",")})`);
    }

    /**
     *  Apply a deduplication filter
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#dedup
     *
     *  @param {string} [prop=ogit/_id] - the property to perform the deduplication on.
                            You will almost always want the default (`ogit/_id`).
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    dedup(prop = "ogit/_id") {
        return this.raw(`dedup{it.getProperty(${quote(prop)})}`);
    }

    /**
     *  Restrict results to a subset of the pipeline
     *
     *  NB. `start` zero based an inclusive, `finish` is absolute (not relative to start) and inclusive.
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#ij
     *
     *  @param {number} start - where to begin from
     *  @param {number} finish - where to end
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    limit(start, finish) {
        //this needs to be merged directly onto the last element of the query!
        //but only after we have provided the clause to filter deleted elements.
        //otherwise this limiting will no do what we expect.
        //@TODO check in GraphIT as to whether this is still needed...
        this.hasNot("ogit/_is-deleted", true);
        //now append the limit
        return this.append(`[${start}..${finish}]`);
    }

    /**
     *  Re-order the pipeline
     *
     *  Note that in GraphIT almost everything is a string, so ordering is
     *  lexical. (most codecs created by {@link createCodec} respect lexical ordering)
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#order
     *
     *  @param {string} prop - the property to order by
     *  @param {string} dir - the direction of the ordering, `asc` or `desc`.
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    order(prop, dir = "desc") {
        const isAsc = dir === "asc";
        const getProp = `.getProperty(${quote(prop)})`;
        const [first, second] = isAsc ? ["a", "b"] : ["b", "a"];
        return this.raw(
            `order{it.${first}${getProp} <=> it.${second}${getProp}}`
        );
    }

    /**
     *  Filter the pipeline with a closure.
     *
     *  **NB there is currently no validation of the input**
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#filter-1
     *
     *  @param {string} condition - the string version of the closure for filtering the pipeline
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    filter(condition) {
        //NB no validation is done here!
        //perhap we could improve with
        // filter(subjectGremlinQuery, comparator, object)
        // e.g filter(_ => _.getProperty("age"), ">", 29);
        return this.raw(`filter{${condition}}`);
    }

    /**
     *  Shorthand for a transform that adds a static temporary property to each result in the pipeline
     *
     *  @param {string} name - the temporary property name (must start with `$_`)
     *  @param {string} value - the static value to add to each result
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    addTempProp(name, value) {
        ensureTemporaryPropNameOK(name);
        this.raw(`transform{it.${name}=${quote(value)};it}`);
    }
    /**
     *  Shorthand for a transform that adds a dynamic temporary property to each result in the pipeline
     *
     *  @param {string} name - the temporary property name (must start with `$_`)
     *  @param {string|GremlinBranch} query - the query to produce a value to add to each result.
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    addComputedProp(name, query) {
        ensureTemporaryPropNameOK(name);
        const subQuery = createBrancher("it")(query);
        return this.raw(`transform{it.${name}=${subQuery};it}`);
    }

    /**
     *  Group results by given property's value
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#groupby
     *
     *  @param {string} groupingProp - the property to group by.
     *  @param {string} resultProp - the property to use in the groups - probably `ogit/_id`
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    groupBy(groupingProp, resultProp = false) {
        const prop = groupingProp === "label"
            ? groupingProp
            : `getProperty(${quote(groupingProp)})`;
        const resultStanza = resultProp
            ? `it.getProperty(${quote(resultProp)})`
            : "it";
        return this.raw(`groupBy{it.${prop}}{${resultStanza}}.cap`);
    }

    /**
     *  Count results grouped by given property's value
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#groupby
     *
     *  @param {string} groupingProp - the property to group by.
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    groupCount(groupingProp) {
        const prop = groupingProp === "label"
            ? groupingProp
            : `getProperty(${quote(groupingProp)})`;
        return this.raw(`groupCount{it.${prop}}.cap`);
    }

    /**
     *  Traverse to incoming edges
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#ine
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    inE(...args) {
        return this.raw(methodCall("inE", args));
    }

    /**
     *  Traverse to outbound edges
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#oute
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    outE(...args) {
        return this.raw(methodCall("outE", args));
    }

    /**
     *  Traverse to edges in both directions
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#bothe
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    bothE(...args) {
        return this.raw(methodCall("bothE", args));
    }

    /**
     *  Traverse to incoming vertices
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#inv
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    inV(...args) {
        return this.raw(methodCall("inV", args));
    }

    /**
     *  Traverse to outbound vertices
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#outv
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    outV(...args) {
        return this.raw(methodCall("outV", args));
    }

    /**
     *  Traverse to vertices in both directions
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#bothv
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    bothV(...args) {
        return this.raw(methodCall("bothV", args));
    }

    /**
     *  Traverse to vertices along inbound edges
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#in
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    in(...args) {
        return this.raw(methodCall("in", args));
    }
    /**
     *  Traverse to vertices along outbound edges
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#out
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    out(...args) {
        return this.raw(methodCall("out", args));
    }

    /**
     *  Traverse to vertices along edges in either direction
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#both
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    both(...args) {
        return this.raw(methodCall("both", args));
    }

    /**
     *  pluck a property value from each element in the pipeline
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#key
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    getProperty(...args) {
        return this.raw(methodCall("getProperty", args));
    }

    /**
     *  Count the results in the pipeline
     *
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    count(...args) {
        return this.raw(methodCall("count", args));
    }

    /**
     *  Mark a pipeline position for later back-filtering
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#as
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    as(...args) {
        return this.raw(methodCall("as", args));
    }

    /**
     *  Back-filter to a named step or by a number of steps.
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#back
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    back(...args) {
        return this.raw(methodCall("back", args));
    }

    /**
     *  Randomize pipeline output order
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#shuffle
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    shuffle(...args) {
        return this.raw(methodCall("shuffle", args));
    }

    /**
     *  Filter the pipeline to object which match the pattern
     *
     *  The argument here can be an object of "prop" => "value" (which you
     *  can encode with a {@see Codec})
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#has
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    has(...args) {
        return objectMethodCall(this, "has", args);
    }

    /**
     *  Filter the pipeline to object which **don't** match the pattern
     *
     *  The argument here can be an object of "prop" => "value" (which you
     *  can encode with a {@see Codec})
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#hasnot
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    hasNot(...args) {
        return objectMethodCall(this, "hasNot", args);
    }

    /**
     *  Reduce the pipeline to a single property from each item
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#property
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    property(...args) {
        return this.raw(methodCall("property", args));
    }

    /**
     *  Calls the `tree` side-effect grouping all traversed edges/vertices.
     *
     *  @see http://gremlindocs.spmallette.documentup.com/#tree
     *  @return {GremlinQueryBuilder} - the same object (chainable)
     */
    tree() {
        return this.raw("tree.cap");
    }
}

//helper to validate temporary property name
const ensureTemporaryPropNameOK = name => {
    if (name.indexOf("$_") !== 0) {
        throw new Error(
            `Gremlin temporary properties must start with $_, given: ${name}`
        );
    }
};

//creates a branched structure with subQueries
const createBrancher = (prefix, ctx) => (value, key = false) => {
    const subQuery = new GremlinQueryBuilder(prefix, ctx);
    //if a string, assume a fixed query
    if (typeof value === "string") {
        subQuery.raw(value);
    } else {
        value(subQuery);
    }
    return (key ? key + ":" : "") + subQuery;
};

//quote a value for use in a gremlin function argument.
const quote = value => `"${value.replace(/"/g, `\\"`).replace(/\$/g, `\\$`)}"`;

const formatArgs = args =>
    args.map(value => {
        if (value === true || value === false) {
            //don't quote;
            return value ? "true" : "false";
        }
        if (Array.isArray(value)) {
            //OK, an array of values need quoting and adding surrounded by
            //square brackets
            return `[${formatArgs(value).join(",")}]`;
        }
        //after this cast to string
        const str = "" + value;

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
const methodCall = (method, args = []) => {
    return `${method}(${formatArgs(args).join(",")})`;
};

const objectMethodCall = (instance, method, args = []) => {
    const first = args[0];
    if (typeof first === "object") {
        Object.keys(first).forEach(key => {
            //only single arguments in this form.
            instance.raw(methodCall(method, [key, first[key]]));
        });
        return instance;
    }
    return instance.raw(methodCall(method, args));
};
