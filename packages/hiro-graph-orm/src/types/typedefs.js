/**
 * The codec represents a simple `encode`/`decode` function pair
 *
 * @typedef {Object} Codec
 * @property {function(input: *): string} encode - the `encoder` function
 * @property {function(input: string): *} decode - the `decoder` function
 */

/**
 * Represents a result which is either a single vertex or an array of them
 *
 * @typedef {GraphVertex|Array<GraphVertex>} OneOrMoreVertices
 */

/**
 *  This is our representation of a Lucene Query.
 *
 *  When parsed the keys and value's here automagically get converted by our {@link Schema}
 *  into the correct values for the GraphIT side.
 *
 *  For the full API documentation for this look at [Lucene Queries](manual/usage.html#lucene-query-syntax)
 *
 *  @typedef {object} LuceneQuery
 */

/**
  *  A possible branch definition for a Gremlin function
  *
  *  Used in `transform`, `copySplit`, etc...
  *
  *  It is either a static string, or a function which is provided a gremlin pipeline
  *  which the function should act on.
  *
  *  @typedef {string|function(pipe: GremlinQueryBuilder)} GremlinBranch
  */
