/**
 *  Schema aware Gremlin wrapper.
 */
import { gremlin } from '../context/graph';
import { GremlinQueryBuilder, T } from '@hiro-graph/client';

export { T };

/**
 *  Create a new query builder
 *
 *  @param {string|GremlinQueryBuilder} initialQuery - a starting point query
 *  @param {Context} context - a {@link Context} object, allowing this gremlin query to `execute` itself.
 *  @return {GremlinQueryBuilder} - a new query builder
 */
export function queryBuilder(initialQuery, context) {
    return new OrmGremlinQueryBuilder(initialQuery, context);
}

/**
 *  A simple gremlin query builder object.
 *
 *  Provides a convenience for having to produce the queries by hand,
 *  and escapes the terms correctly.
 */
export class OrmGremlinQueryBuilder extends GremlinQueryBuilder {
    /**
     *  @param GremlinQueryBuilder} initialQuery - An initial query to base this one on.
     *  @param {?Context} context - a {@link Context} object, allowing this gremlin query to `execute` itself.
     *  @return {GremlinQueryBuilder} - a new query builder
     */
    constructor(initialQuery = false, context) {
        super(initialQuery);
        this._ctx = context;
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
            throw new Error('Cannot use gremlin `relation` without context');
        }

        const query = this._ctx[type].relationQuery(relations);

        return this.raw(query);
    }
}
