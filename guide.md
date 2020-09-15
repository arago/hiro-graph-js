# HIRO 7 JS Migration Guide (working draft)

## Libraries

### HIRO Graph Client

`@hiro-graph/client@^7.3.9` (https://www.npmjs.com/package/@hiro-graph/client)

```JS
import Client from '@hiro-graph/client';

const client = new Client({
  endpoint: 'http://localhost:8888',
  token: tokenInstance,
});
```

## Creating, Deleting Nodes and Relationships

### Node Creation

For the node creation use the create method from the hiro graph client.

Example:

```JS
const dataForHiro = {
  ...,
  'ogit/_scope': instanceScopeId
};

return client.create(OGIT_NODE_TYPE, dataForHiro);
```

Where:

- client: is the client from the library.
- OGIT_NODE_TYPE: is the node type being created.
- dataForHiro: is a JSON object containing the data needed for the creation of the node.

### Node Deletion

For the node deletion use the delete method from the hiro graph client.

Example:

```JS
return client.delete(nodeId);
```

Where:

- client: is the client from the library.
- nodeId: is the ID of the node being deleted.

### Relations Creation

For creating and removing relationship between nodes use the connect and disconnect methods from hiro graph client.

```JS
client.connect(OGIT_EDGE_TYPE, inId, outId);
```

```JS
client.disconnect(OGIT_EDGE_TYPE, inId, outId);
```

Where:

- client: is the client from the library.
- OGIT_EDGE_TYPE: is edge relationship type being created or disconnected.
- inId: is the Node id of the IN relationship
- outId: is the Node id of the OUT relationship

## Queries

### Gremlin

_Gremlin is now part of the `@hiro-graph/client` library_

```JS
import { gremlin } from '@hiro-graph/client';

const query = gremlin('')
  .inE(OGIT_EDGE_TYPE)
  .has('ogit/_out-type', OGIT_NODE_TYPE)
  .inV()
  .toString();

client.gremlin(START_NODE_ID, query);
```

Where:

- OGIT_EDGE_TYPE: is edge relationship type being created or disconnected.
- OGIT_NODE_TYPE: example node type
- START_NODE_ID: is the starting node's ID

#### Add a Range / Limit

- http://gremlindocs.spmallette.documentup.com/#ij

**This needs to be merged directly onto the last element of the query!**

```JS
import { gremlin } from '@hiro-graph/client';

const query = gremlin('')
  ...someGremlinQuery
  .limit(start, finish)
  .toString();

client.gremlin(START_NODE_ID, query);
```

Where:

- start: index of where to start the range from
- finish: index of where to end the range from

### Lucene

_Lucene is now part of the `@hiro-graph/client` library_

```JS
import { lucene } from '@hiro-graph/client';

const { querystring, placeholders } = lucene({
  'ogit/_type': OGIT_NODE_TYPE,
});

client.lucene(querystring, { limit: 1, ...placeholders });

```

Where:

- OGIT_NODE_TYPE: example node type
