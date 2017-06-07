/**
 * A {@link Context} has properties named after each Entity with a set of bound functions
 *
 *  This fake class documents the methods attached to each entity name.
 */
export class Context$Entity {
    /**
     *  find vertices of type `Entity`
     *
     *  @param {LuceneQuery} query - the lucene query to use for search
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<Array<GraphVertex>>}
     */
    find(query, options) {} //eslint-disable-line

    /**
     *  find vertices of type `<Entity>` by Id or an array of ids
     *
     *  @param {string|Array<string>} idOrIds - the lucene query to use for search
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<OneOrMoreVertices>}
     */
    findById(idOrIds, options) {} //eslint-disable-line

    /**
     *  find the first vertex of type `<Entity>`
     *
     *  @param {LuceneQuery} query - the lucene query to use for search
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<GraphVertex>}
     */
    findOne(query, options) {} //eslint-disable-line

    /**
     *  find the number of vertices matching the query.
     *
     *  NB if you pass `limit` as an option and it is not `-1` the returned
     *  value will be at most the `limit` value
     *
     *  @param {LuceneQuery} query - the lucene query to perform
     *  @param {object} options - the options to pass on to the query {@todo document these}
     *  @return {Promise<number>} - the count of results or an error
     */
    findCount(query, options = {}) {} //eslint-disable-line

    /**
     *  find vertices of type `Entity` that match the search term as well as the filter
     *
     *  @param {string|object} term - the search term or `$search` object (see [Lucene Queries](../../../manual/usage.html#-search-queries))
     *  @param {LuceneQuery} filter - the lucene query to used to limit results
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<Array<GraphVertex>>}
     */
    search(term, filter, options) {} //eslint-disable-line

    /**
     *  create a new vertex of type `<Entity>`
     *
     *  @param {object} appData - the data for the new vertex
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<GraphVertex>}
     */
    create(appData, options) {} //eslint-disable-line

    /**
     *  Connect 2 vertices with a given relation
     *
     *  The edge will be `{source}$${verb}$${target}`.
     *  The verb is inferred from the `relation` parameter.
     *
     *  @param {string} relation - the named relation to connect by
     *  @param {string} source - the ID of the source vertex
     *  @param {string} target - the ID of the target vertex
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<undefined>} - just a promise that resolves when connected
     */
    connect(relation, source, target, options) {} //eslint-disable-line

    /**
     *  Disconnect 2 vertices along a given relation.
     *
     *  The edge deleted will be `{source}$${verb}$${target}`.
     *  The verb is inferred from the `relation` parameter.
     *
     *  @param {string} relation - the named relation to disconnect
     *  @param {string} source - the ID of the source vertex
     *  @param {string} target - the ID of the target vertex
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<undefined>} - just a promise that resolves when connected
     */
    disconnect(relation, source, target, options) {} //eslint-disable-line

    /**
     *  update a new vertex with new data.
     *
     *  @param {string} id - the ID of the vertex to update
     *  @param {object} appData - the data for the new vertex
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<GraphVertex>}
     */
    update(id, appData, options) {} //eslint-disable-line

    /**
     *  replace a new vertex with new data (destructive!)
     *
     *  @param {string} id - the ID of the vertex to update
     *  @param {object} appData - the data for the new vertex
     *  @param {object} [options={}] - extra options for the query
     *  @return {Promise<GraphVertex>}
     */
    replace(id, appData, options) {} //eslint-disable-line

    /**
     *  Encode application data to graph data.
     *
     *  @param {object} appData - application level data
     *  @return {object} graphData - graph encoded data
     */
    encode(appData) {} //eslint-disable-line

    /**
     *  Decode graph data to application data.
     *
     *  @param {object} graphData - graph encoded data
     *  @return {object} appData - application level data
     */
    decode(graphData) {} //eslint-disable-line

    /**
     *  Generate the Gremlin Query factory for the given relation.
     *
     *  @example
     *      query = ctx.Entity.relationQuery("relates");
     *      gremlin = query(ctx.gremlin());
     *      gremlin.execute(rootId).then(...)
     *
     *  @param {string} relation - the name of the relation
     *  @return {GremlinBranch}
     */
    relationQuery(relation) {} //eslint-disable-line

    /**
     *  Boolean Relation query between 2 vertex ids.
     *
     *  @example
     *      ctx.Entity.hasRelation(id, "foo", barId).then(itHas => {
     *          if (itHas) {
     *              console.log(id + " has `foo` relation to " + barId);
     *          }
     *      })
     *
     *  @param {string} vertexId - the ID of the vertex we are checking
     *  @param {string} relation - the name of a relation
     *  @param {string} queryId - the ID of the vertex that *might* have the relation to the first vertex
     *  @return {Promise<boolean>}
     */
    hasRelation(vertexId, relation, queryId) {} //eslint-disable-line

    /**
     *  Like `vtx.fetchVertices(relations)` but for an ID, not a vertex.
     *
     *  @example
     *
     *  @param {string} vertexId - the ID of the vertex we are checking
     *  @param {string} relations - the name of the relations to query
     *  @return {Promise<object>} - an object with keys for each "relation" and an array of vertices, for each value.
     */
    findRelationVertices(id, relations) {} //eslint-disable-line

    /**
     *  Like `vtx.fetchIds(relations)` but for an ID, not a vertex.
     *
     *  @example
     *
     *  @param {string} vertexId - the ID of the vertex we are checking
     *  @param {string} relations - the name of the relations to query
     *  @return {Promise<object>} - an object with keys for each "relation" and an array of ids, for each value.
     */
    findRelationIds(id, relations) {} //eslint-disable-line

    /**
     *  Like `vtx.fetchCount(relations)` but for an ID, not a vertex.
     *
     *  @example
     *
     *  @param {string} vertexId - the ID of the vertex we are checking
     *  @param {string} relations - the name of the relations to query
     *  @return {Promise<object>} - an object with keys for each "relation" and a number for each value.
     */
    findRelationCount(id, relations) {} //eslint-disable-line

    /**
     *  used internally
     *  @ignore
     */
    fetchVertices(relations, options) {} //eslint-disable-line
    /**
     *  used internally
     *  @ignore
     */
    fetchIds(relations, options) {} //eslint-disable-line
    /**
     *  used internally
     *  @ignore
     */
    fetchCount(relations, options) {} //eslint-disable-line
}
