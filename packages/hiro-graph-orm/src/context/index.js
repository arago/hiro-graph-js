/**
 *  Defines a Schema aware GraphIT client library
 */
import { queryBuilder } from "../gremlin";
import {
    find,
    findById,
    findOne,
    findCount,
    search,
    create,
    update,
    replace,
    connect,
    disconnect,
    deleteVertex,
    fetchMe,
    naiveDetectRaw,
    vertexize
} from "./graph";
import { createVertex } from "../vertex/graph";
import { mapPromiseIfArray, deprecationWarning } from "../utils";
import {
    getRelationQuery,
    fetchVertices,
    fetchIds,
    fetchCount
} from "./relations";
import isPlainObject from "lodash.isplainobject";
import Schema from "../schema";
import Client from "hiro-graph-client";

//shorthand for creating the getCount/Ids/Vertices fetching functions
const relationFetch = (ctx, method, relations, options = {}) =>
    mapPromiseIfArray(input => {
        return Promise.resolve(input)
            .then(vertex => {
                if (typeof vertex[method] !== "function") {
                    // Could be raw
                    if (naiveDetectRaw(vertex)) {
                        const entity = ctx._schema.get(vertex["ogit/_type"]);
                        if (entity) {
                            return vertexize(ctx, entity)(input);
                        } else {
                            throw new TypeError(
                                `Trying to call "${method}" on raw GraphVertex without Schema!\n` +
                                    `Check whether you have defined Schema for "ogit/_type: ${
                                        vertex["ogit/_type"]
                                    }"`
                            );
                        }
                    } else {
                        throw new TypeError(
                            `Trying to call "${method}" on non GraphVertex object!\n` +
                                `Check whether or not you have converted the objects to plain`
                        );
                    }
                }
                return vertex;
            })
            .then(vertex => vertex[method](relations, options));
    });

const noEntity = "_no_entity";

/**
 *  The context is a wrapper for the schema and client.
 *
 *  The major expost of the entire module.
 *
 *  Apart from it's direct methods, every {@link Entity} in the {@link Schema} has a
 *  property on this object, which has the methods documented in {@link Context$Entity}.
 */
export default class Context {
    /**
     *  @param {Client|object} clientSpec - This should be an `hiro-graph-client` `Client` object,
     *                                              or the constructor args to create one.
     *  @param {Schema|Array} schemaSpec - This should be a {@link Schema} or the constructor args to create one.
     *  @param {?Map} [cache=new&nbsp;Map()] - The vertex cache. Any object satisfying the `Map` interface should be OK.
     */
    constructor(connectionSpec, schemaSpec, cache = new Map()) {
        let client = connectionSpec;
        if (isPlainObject(connectionSpec)) {
            client = new Client(connectionSpec);
        }

        this._client = client;
        this._cache = cache;
        this._log = [];

        if (schemaSpec instanceof Schema) {
            this._schema = schemaSpec;
        } else {
            this._schema = new Schema(schemaSpec);
        }

        this.removeOnUpdateListener = this._schema.addUpdateListener(schema => {
            // This is currently the safety on the footgun
            this._cache.clear();
            mapEntityShortcuts(this, schema, schema.names);
        });

        mapEntityShortcuts(this, this._schema, [
            noEntity,
            ...this._schema.names
        ]);

        //this adds the instance specific methods for each entity type
        //and one for "_no_entity"
    }

    /**
     *  This returns the vertex from the owner of the access token in use.
     *  @return {Promise<GraphVertex>}
     */
    me() {
        //this is a bit different.
        return fetchMe(this);
    }

    /**
     * Get's the underlying GraphIT Client.
     *
     * @return {Client}
     */
    getClient() {
        return this._client;
    }

    /**
     *  The old method for getting a connection, deprecated
     *  @deprecated
     */
    getConnection() {
        return deprecationWarning(
            () => this.getClient(),
            "`getConnection` is deprecated, please use `getClient` instead. This method will be removed in a future version"
        );
    }

    /**
     * Exchange the current cache for a new one.
     *
     * You likely want to do this early on, before
     * any entries have gone in.
     *
     * @param {Map} cache - the new cache to use. Only needs to satisfy the `Map` interface, not actually be a `Map`
     */
    setCache(cache) {
        this._cache = cache;
    }

    /**
     *  On the Context itself, this is an `un-typed` query for a single vertex.
     *
     *  i.e. will search all entity types and return any one of them.
     *
     *  @param {LuceneQuery} query - the lucene query to perform
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<GraphVertex>} - the first vertex found or an error
     */
    findOne(query, options = {}) {
        return this._no_entity.findOne(query, options);
    }
    /**
     *  On the Context itself, this is an `un-typed` query by id only
     *
     *  i.e. will search all entity types for the given id or array of ids.
     *
     *  @param {string|Array<string>} idOrIds - the id or array of ids to fetch
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<OneOrMoreVertices>} - the vertex/vertices found or an error
     */
    findById(idOrIds, options = {}) {
        return this._no_entity.findById(idOrIds, options);
    }

    /**
     *  On the Context itself, this is an `un-typed` query.
     *
     *  i.e. will search all entity types and return any of them.
     *
     *  @param {LuceneQuery} query - the lucene query to perform
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<OneOrMoreVertices>} - the first vertex found or an error
     */
    find(query, options = {}) {
        return this._no_entity.find(query, options);
    }

    /**
     *  On the Context itself, this is an `un-typed` query.
     *
     *  i.e. will search all entity types and return the count of results
     *
     *  @param {LuceneQuery} query - the lucene query to perform
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<number>} - the count of results or an error
     */
    findCount(query, options = {}) {
        return this._no_entity.findCount(query, options);
    }
    /**
     *  On the Context itself, this is an `un-typed` search.
     *
     *  i.e. will search all entity types and return any of them.
     *
     *  @param {string|object} query - the search term or search definition.
     *  @param {LuceneQuery} filter - the lucene query to further restrict the results
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<OneOrMoreVertices>} - the first vertex found or an error
     */
    search(query, filter = {}, options = {}) {
        return this._no_entity.search(query, filter, options);
    }

    /**
     *  Deletes a vertex by id.
     *
     *  @param {string} vertexId - the id of the vertex to delete
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<GraphVertex>} - the vertex (marked as deleted)
     */
    delete(vertexId, options = {}) {
        return deleteVertex(this, vertexId, options);
    }

    /**
     *  Create A Gremlin Query Builder with Context.
     *
     *  @param {?string} initialQuery - the starting point for the new query.
     *  @return {GremlinQueryBuilder} - a context aware gremlin query builder (e.g. `query.execute()` will work)
     */
    gremlin(initialQuery) {
        return queryBuilder(initialQuery, this);
    }

    /**
     *  Passthrough a count fetch in a promise
     *
     *  @example
     *  context.find({}).then(context.fetchCount(["related"]));
     *
     *  @param {Array<string>} relations - the relations to query for. These should match valid relation names on the entities passed in.
     *  @param {object} options - options to pass through to the underlying call
     *  @return {function(items: OneOrMoreVertices): Promise<OneOrMoreVertices>}
     *      - returns a function which will call `fetchCount(relations, options)` on each input
     */
    fetchCount(relations, options = {}) {
        return relationFetch(this, "fetchCount", relations, options);
    }

    /**
     *  Passthrough a id fetch in a promise
     *
     *  @example
     *  context.find({}).then(context.fetchIds(["related"]));
     *
     *  @param {Array<string>} relations - the relations to query for. These should match valid relation names on the entities passed in.
     *  @param {object} options - options to pass through to the underlying call
     *  @return {function(items: OneOrMoreVertices): Promise<OneOrMoreVertices>}
     *      - returns a function which will call `fetchIds(relations, options)` on each input
     */
    fetchIds(relations, options = {}) {
        return relationFetch(this, "fetchIds", relations, options);
    }

    /**
     *  Passthrough a vertex fetch in a promise
     *
     *  @example
     *  context.find({}).then(context.fetchVertices(["related"]));
     *
     *  @param {Array<string>} relations - the relations to query for. These should match valid relation names on the entities passed in.
     *  @param {object} options - options to pass through to the underlying call
     *  @return {function(items: OneOrMoreVertices): Promise<OneOrMoreVertices>}
     *      - returns a function which will call `fetchVertices(relations, options)` on each input
     */
    fetchVertices(relations, options = {}) {
        return relationFetch(this, "fetchVertices", relations, options);
    }

    /**
     *  Fetch an entity from the schema.
     *
     *  @param {string} name - the name of the entity, can be the application name, or the OGIT name
     *  @return {?Entity} - the entity if found.
     */
    getEntity(name) {
        return this._schema.get(name);
    }

    /**
     *  Manually remove an item from the ORM cache.
     *
     *  @param {string} vertexId - the ID of the vertex to drop.
     *  @return {undefined} - no return value
     */
    remove(vertexId) {
        this._cache.delete(vertexId);
    }

    /**
     *  Manually give the orm data, raw from Graphit
     *
     *  Useful when you have have to bypass the regular system, or have nodes stored somewhere else.
     *
     *  @param {object} rawData - the raw GraphIT vertex data;
     *  @return {GraphVertex} - the inserted vertex
     */
    insertRaw(rawData) {
        const entity = this.getEntity(rawData["ogit/_type"]);
        const decoded = entity.decode(rawData);
        return this.insert(decoded);
    }

    /**
     *  Manually give the orm data, in application format
     *
     *  @param {object} appData - the application vertex data object
     *  @return {GraphVertex} - the inserted vertex
     */
    insert(appData) {
        return createVertex(appData, this);
    }
}

const mixinMethods = {
    find: (ctx, entity) => (query, options = {}) =>
        find(ctx, entity, query, options),
    findById: (ctx, entity) => (idOrIds, options = {}) =>
        findById(ctx, entity, idOrIds, options),
    findOne: (ctx, entity) => (query, options = {}) =>
        findOne(ctx, entity, query, options),
    findCount: (ctx, entity) => (query, options = {}) =>
        findCount(ctx, entity, query, options),
    search: (ctx, entity) => (query, filters, options = {}) =>
        search(ctx, entity, query, filters, options),
    create: (ctx, entity) => (data, options = {}) =>
        create(ctx, entity, data, options),
    connect: (ctx, entity) => (relation, source, target, options = {}) =>
        connect(ctx, entity, { relation, source, target }, options),
    disconnect: (ctx, entity) => (relation, source, target, options = {}) =>
        disconnect(ctx, entity, { relation, source, target }, options),
    update: (ctx, entity) => (vertexId, appData, options = {}) =>
        update(ctx, entity, vertexId, appData, options),
    replace: (ctx, entity) => (vertexId, appData, options = {}) =>
        replace(ctx, entity, vertexId, appData, options),
    encode: (ctx, entity) => appData => entity.encode(appData),
    decode: (ctx, entity) => graphData => entity.decode(graphData),
    relationQuery: (ctx, entity) => relation =>
        getRelationQuery(entity, relation),
    findRelationVertices: (ctx, entity) => (id, relations) =>
        fetchVertices(ctx, entity)(relations)(id),
    findRelationIds: (ctx, entity) => (id, relations) =>
        fetchIds(ctx, entity)(relations)(id),
    findRelationCount: (ctx, entity) => (id, relations) =>
        fetchCount(ctx, entity)(relations)(id),
    hasRelation: (ctx, entity) => (id, relation, test) =>
        getRelationQuery(entity, relation)
            .has("ogit/_id", test)
            .count()
            .executeInContext(ctx, id, { raw: true })
            .then(([count]) => count > 0),
    fetchVertices,
    fetchIds,
    fetchCount
};
const mixinMethodNames = Object.keys(mixinMethods);

//Adds entity methods
//
// like ctx.Profile.find()
const mapEntityShortcuts = (ctx, schema, names) => {
    //we add "_unbound" to add use for the unbound instance methods.
    //they have a null entity, the others get an Identity
    names.forEach(name => {
        const entity = schema.get(name === noEntity ? null : name);
        ctx[name] = mixinMethodNames.reduce((obj, method) => {
            obj[method] = mixinMethods[method](ctx, entity);
            return obj;
        }, {});
    });
};
