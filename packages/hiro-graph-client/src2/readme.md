# new Client setup

```js
import {Client, Token} from '@hiro-graph/client';
...

const token = new Token(() => doLogin(), () => 'token') ;

const client = new Client(token, 'https://graph.co', {});
// To get async graph info
await client.setup();
```

# Use extensions 

```js
import {Variables6} from '@hiro-graph/client';
...

Variables6.add(client, { name: 'MyVar', todo: true });

const variables = Variables6.factory(client);
variables.add({ name: 'MyVar', todo: true });
```

