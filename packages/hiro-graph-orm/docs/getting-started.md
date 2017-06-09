# Features

The package provides the `Schema` and `Context` objects. These combined with a GraphIT [`Client`](https://github.com/arago/hiro-graph-js/hiro-graph-client) provide a powerful abstraction over the GraphIT API and data.

 - A mapping between the "string-only" GraphIT attributes and rich in-app attributes.
 - Management complex multi/single hop relationships between vertices and the Gremlin queries required to perform them.
 - Vertex Cache to save re-fetching vertices unless wanted.
 - Promise-based abstractions to fetching GraphIT data
 - helpers for lucene and gremlin queries.

# Schema

This helps you use real types in you in-app vertex objects. Schema definitions should be shared among applications to ensure maximum consistency in how data is stored in the graph.

To that end there is a *common* schema available at [`hiro-graph-orm-mappings`](https://github.com/arago/hiro-graph-js/package/hiro-graph-orm-mappings) which you can import. This holds a reasonable schema that should suit most needs, but doesn't cover all the available [OGIT](https://github.com/arago/OGIT) entities.

It should be extended in your application if you need more.

Full details on [Schema definitions](./schema-definitions.md)

# Context

This object wraps a GraphIT Client and a Schema to provide a rich schema-aware environment for interacting with the Graph.
