# A base schema for sane application level mappings to OGIT

see `arago/js-graph-orm` for details on how the schema works and what it is useful for.

This module provides schema definitions for common OGIT entities and relations.

They can be imported individually or in a block.

as a block

```
import { Schema } from "hiro-graph-orm";

import mappings from "hiro-graph-orm-mappings";

const schema = new Schema(mappings);
```

or individually

```
import { Schema } from "hiro-graph-orm";

//this would include everything in a bundle, not so good for frontend
import { Person, Org } from "hiro-graph-orm-mappings";
//or better for frontend
import Person from "hiro-graph-orm-mappings/lib/person";
import Org from "hiro-graph-orm-mappings/lib/org";

const schema = new Schema([Person, Org]);

```

