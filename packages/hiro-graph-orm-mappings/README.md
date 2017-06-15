# `hiro-graph-orm-mappings`: Common mappings for `hiro-graph-orm`

Common [OGIT](https://github.com/arago/OGIT) entity type and relation mappings for [`hiro-graph-orm`](https://github.com/arago/hiro-graph-js/tree/master/packages/hiro-graph-orm)

See [`hiro-graph-orm`](https://github.com/arago/hiro-graph-js/tree/master/packages/hiro-graph-orm) for details on how the schema works and what it is useful for.

## installation

```bash
$ npm install hiro-graph-orm-mappings
```

Then they can be imported individually or in a block.

As a block:

```javascript
import { Schema } from "hiro-graph-orm";

import mappings from "hiro-graph-orm-mappings";

const schema = new Schema(mappings);
```

Or individually:

```javascript
import { Schema } from "hiro-graph-orm";

//this would include everything in a bundle, not so good for frontend
import { Person, Org } from "hiro-graph-orm-mappings";
//or better for frontend
import Person from "hiro-graph-orm-mappings/lib/person";
import Org from "hiro-graph-orm-mappings/lib/org";

const schema = new Schema([Person, Org]);

```
