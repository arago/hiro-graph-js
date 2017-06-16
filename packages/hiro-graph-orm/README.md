# `hiro-graph-orm`: a *more-than-just-string* type aware wrapper for HIRO Graph

Define a schema, create a connection to HIRO Graph, and have a natural way to handle data.


If you only want the Vertex Object for the frontend, only import the one file:


```javascript
import Vertex from "hiro-graph-orm/lib/vertex";
```

## Quick Start

## installation

```bash
$ npm install hiro-graph-orm hiro-graph-orm-mappings
```

### usage



```javascript
import HiroGraphOrm from "hiro-graph-orm";
import { Token } from "hiro-graph-client";
import mappings from "hiro-graph-orm-mappings";

const token = new Token({ getToken: () => "some access token" });

const ctx = new HiroGraphOrm({ endpoint: "https://graphit/", token }, mappings);

//fetch the user of this access token.
ctx.me().then(me => {
    console.log(JSON.stringify(me, null, 4));
})
.catch(err => {
    console.log("something bad happened", err.stack);
});

// find the owner of the access token and `orgs`
ctx.me()
    .then(myVertex => { //here we have a `GraphVertex` object
        return myVertex.fetchIds(["orgs"]); // get the id's of vertices for my "orgs"
    })
    .then(myVertex => {
        //now we have the vertices for orgs.
        console.log(myVertex.getIds("orgs")); // "arago.de", "example.com", ...
    });

//the above could have been written with the `Context.fetchIds` helper.
ctx.me()
    .then(ctx.fetchIds(["orgs"]))
    .then(myVertex => console.log(myVertex.getIds()));

//do a lucene query (schema aware)
//
// find users created in the last hour.
ctx.Person.find({
    $range: {
        "_created-on": [Date.now() - 3600, Date.now()]
    }
});

//find by a single id (ensuring the correct entity type)
ctx.Org.findById("arago.co"); //-> promise resolves with the arago.co vertex
ctx.Person.findById("arago.co"); //-> promise rejects with a 404 error

//do a gremlin query (get all members of all my orgs)
ctx.gremlin()
    .relation("Person", ["org"])
    .relation("Org", ["members"])
    .dedup()
    .execute(rootVertexId) //-> promise resolves to the returned vertices.
```

## Validation

This package contains a library to verify an your local schema mappings match up against a given OGIT schema. OGIT defines an ontology that restricts what attributes and connections a vertex can have, you may create a schema mapping that conflicts with this and this tool helps to identify any problems.

@TODO: The tool only works with YAML ontologies, not the current TTL/RDF format. Also providing a binary would be nice ;).

```javascript
// NODE JS ONLY
const { default: validate } = require("hiro-graph-orm/lib/schema/validate");

const schema = require("/path/to/your/schema/mappings/array/module");

const ontologyPath = "/path/to/your/OGIT/yaml/directory/or/file";

const result = validate(schema, ontologyPath);

console.log(result); // hopefully { errors: 0, detail: {} }
```

If there are errors, the `detail` object will contain much more information keyed by `ogit/_type`, to help you make the required changes to either the schema or the ontology.


