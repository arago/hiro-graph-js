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

Where:

- tokenInstance: is a token string or Token instance.

#### Token Object

```JS
const myToken = new Token({
  onInvalidate: () => {
    // Handle unauthorized Token
    return Promise.resolve();
  },
  getToken: () => Promise.resolve(token),
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

const limit = 10; //items per page;
const offset = limit * (currentPage - 1);

client.lucene(querystring, { limit: limit, offset: offset, ...placeholders });

```

Where:

- OGIT_NODE_TYPE: example node type
- limit: amount of items returned from query
- offset: amount of items to offset the query by

## Example of Server Side Login

```JS
async function getToken() {
  const response = await fetch(`${GRAPH_ENDPOINT}/api/auth/6/app`, {
    method: 'POST',
    headers: {
      contentType: 'application/json',
    },
    body: JSON.stringify({
      client_id: '<CLIENT_ID>',
      client_secret: '<CLIENT_SECRET>',
      username: '<USERNAME>',
      password: '<PASSWORD>',
    }),
  });

  if (response.status === 200) {
    const { _TOKEN: token } = await response.json();

    return token;
  } else {
    throw new Error('Cannot get token');
  }
}

async function connect() {
  let token = '';

  try {
    token = await getToken();
  } catch {
    // wait and retry connect
    return;
  }

  return client = new Client({ endpoint: GRAPH_ENDPOINT, token });
}
```
