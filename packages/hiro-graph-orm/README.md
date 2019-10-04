# `@hiro-graph/orm`: a _more-than-just-string_ type aware wrapper for HIRO Graph

Define a schema, create a connection to HIRO Graph, and have a natural way to handle data.

## Installation

```bash
$ npm install @hiro-graph/orm
```

If you want some basic Schema mappings (otherwise you must define your own) use:

```bash
$ npm install @hiro-graph/orm @hiro-graph/orm-mappings
```

## Example usage:

```javascript
import HiroGraphOrm from "@hiro-graph/orm";
import { Token } from "@hiro-graph/client";
import mappings from "@hiro-graph/orm-mappings";

const token = new Token({ getToken: () => "some access token" });

const orm = new HiroGraphOrm({ endpoint: "https://graphit/", token }, mappings);

//fetch the user of this access token.
orm.me()
    .then(me => {
        // Log the property `username`
        console.log(me.get("username"));
    })
    .catch(err => {
        console.log("something bad happened", err.stack);
    });
```

---

# `HiroGraphOrm`:

## Who am i?

### `orm.me()`

`me()` will fetch the data for the owner of the access token (is most cases will return a `ogit/_type: Person`)

## Id lookups `findById(<String|Array> Id)`

```javascript
// Find single id...
orm.findById(id);

// Find Array of ids...
orm.findById([id1, id2, ...ids]);

// Using the schema types have slightly different behaviour
orm.Person.findById(id); // "id" *must* belong to a Person otherwise it will throw 404
orm.Person.findById([id1, id2, ...ids]); // all ids must belong to Person nodes otherwise it will throw 404
```

## Basic Querying (`find()` and `findOne()`)

### `orm.{Type}.find(<Object> query, <Object> options)`/`orm.{Type}.findOne(<Object> query, <Object> options)`

`find()` is the primary method for querying the graph (via lucene). It returns a `Promise` that resolves to an array of `GraphVertex` ( in the case of `findOne` it will return a single item)

`query` is an object with key values based on the schema definition (there are also some special keywords that before more advanced queries).

#### Example:

```javascript
// Find Person nodes with lastName "Smith"
orm.Person.find({
    lastName: "Smith"
})
.then(vertices => /* Do something with the vertices */)
.catch(err => /* Handle error */)
```

`options` is an optional object allowing things like pagination and more

```javascript
// default options
{
    offset: 0, // Offset of vertices
    limit: 50, // Limit of vertices
    plain: false, // When set to `true` the returned result is plain javascript objects instead of GraphVertices
    raw: false // When set to `true` the returned result is the raw HIRO graph JSON (no properties are transformed or omitted)
}
```

#### Example default vs `plain: true` vs `raw: true`:

```javascript
// default
orm.Person.find({ firstName: "Wes" })
//-> Resolves to:
[ GraphVertex {
        constructor : function GraphVertex(data, context, guardSymbol) {},
        _before: Object,
        _clean: true,
        _counts: Object,
        _ctx: Context,
        _data: Object,
        _db: Object,
        _free: Object,
        _id: "wwinchester@arago-demo.com",
        _ids :Object,
        _isDeleted :false,
        _vertices: Object,
        get: function get(prop) {},
        set: function set(prop, val) {},
        canWrite : function canWrite() {},
        connect: function connect(relation, vertexOrId) {},
        delete: function _delete() {},
        disconnect: function disconnect(relation, vertexOrId) {},
        fetchCount: function fetchCount(relations) {},
        fetchIds: function fetchIds(relations) {},
        fetchVertices: function fetchVertices(relations) {},
        getVertices: function getVertices(relation) {},
        hasVertices: function hasVertices(relation) {},
        save: function save() {}
    }
]

// { plain: true }
orm.Person.find({ firstName: "Wes" }, { plain: true })
//-> Resolves to:
[
    {
        "_created-on": 1478269242915,
        "profileSet": true,
        "status": "active",
        "_modified-on": 1496667858667,
        "_id": "wwinchester@arago-demo.com",
        "email": "wwinchester@arago-demo.com",
        "lastName": "Winchester",
        "firstName": "Wes",
        "_modified-by": "graphit.co",
        "username": "wwinchester",
        "_type": "Person",
        "_fetched": 1498122689614
    }
]

// { raw: true }
orm.Person.find({ firstName: "Wes" }, { raw: true })
//-> Resolves to:
[
    {
        "ogit/_created-on": 1478269242915,
        "/profileSet": "true",
        "ogit/_custom-id": "wwinchester@arago-demo.com",
        "ogit/_reader": "arago-demo.com",
        "ogit/status": "active",
        "ogit/_modified-on": 1496667858667,
        "ogit/_id": "wwinchester@arago-demo.com",
        "ogit/_creator": "graphit.co",
        "ogit/_graphtype": "vertex",
        "ogit/email": "wwinchester@arago-demo.com",
        "ogit/_owner": "wwinchester@arago-demo.com",
        "/__raidSortKey": "Wes Winchester",
        "ogit/_v": 6,
        "/pictureUploaded": "true",
        "ogit/_modified-by-app": "UserReg_and_OrgMgmt",
        "ogit/_is-deleted": false,
        "/__raidDefaultOrg": "arago-demo.com",
        "ogit/_creator-app": "UserReg_and_OrgMgmt",
        "ogit/lastName": "Winchester",
        "ogit/firstName": "Wes",
        "ogit/_modified-by": "graphit.co",
        "ogit/alternativeName": "wwinchester",
        "ogit/_version": "2.19.0.52",
        "ogit/_type": "ogit/Person"
    }
]
```

### `orm.{Type}.findCount(<Object> query, <Object> options)`

`findCount()` Works the same as the find/findOne expect will return a number instead of an array of results.

```javascript
orm.Person.findCount({ firstName: "Wes" })
.then(res =>
    <- 1
);
```

## Searching

### `orm.{Type}.search(<String> searchTerm, <Object> filter, <Object> options)`

`search()` Works in a different way to find, by default it will preform an `ngram` search on the `ogit/_content` field.
`filter` is an object very similar to the `query` in `find/findOne` in order to have additional filtering of the search.

```javascript
// Simple search example
orm.Profile.search("example.com"); // Search for any people that might match the domain

// Filtered search example
orm.Profile.search("example.com", {
    firstName: "Jane"
}); // Search for any people that might match the domain and have the firstName "Jane"
```

## Advanced `find/findOne` Queries:

To assist with the more complex lucene syntax we introduce some (mongodb inspired) special keys:

-   `$or`: switch to "one or more of these conditions".
-   `$and`: switch to "all of these conditions" (the default, but allows to switch back once in `$or` or `$not`) (aliased as `$must` as well).
-   `$not`: switch to "must not match these conditions".
-   `$range`: create a condition where matches must be in the given range.
-   `$missing`: create a condition which matches the presence of a field.
-   `$search`: helper for more complex matching

A couple of these will need more explanation. Otherwise the test code is a good place to look.

#### Example `$or` query:

```javascript
// find any Person with the firstName "Jane" or "Joe"
orm.Person.find({
    $or: {
        firstName: ["Jane", "Joe"]
    }
});
```

#### Example `$range` query

```javascript
// find everything modified in the last day
orm.Profile.find({
    $range: {
        modified_on: [Date.now() - 86400 * 1000, Date.now()]
    }
});
```

## Gremlin Queries

### `orm.gremlin()`

`gremlin()` is a chainable gremlin query generator that abstracts the `Gremlin` syntax away using the schema it is based on `@hiro-graph/gremlin` with the `.execute(rootId)` method required in order to trigger the request.

#### Example `orm.gremlin()`

```javascript
orm.gremlin()
    .outE("ogit/belongs")
    .inV()
    .has("ogit/_type", "Organization")
    .execute(rootId);
// -> Resolves to [GraphVertex]
```

#### `.relation()` Sugar

`.relation(<String> Type, <Array> relations)` generates the appropriate `outE(edgeName).inV().has("ogit/_type", Type)` or `inE(edgeName).outV().has("ogit/_type", Type)` equivalent based on the schema

```javascript
// using `outE()/inV` etc
orm.gremlin()
    .outE("ogit/belongs")
    .inV()
    .has("ogit/_type", "Organization")
    .execute(rootId);
// -> Resolves to [GraphVertex]

// using `.relation()`
orm.gremlin()
    .relation("Person", ["orgs"])
    .execute(rootId);
// -> Resolves to [GraphVertex]
```

### `orm.fetchVertices()`, `orm.fetchIds()`, `orm.fetchCount()`

These methods are syntactic sugar for invoking the `GraphVertex` "relations" methods in the given results.

#### Example:

```javascript
// Persons then load their Orgs
orm.Person.find({})
	.then(orm.fetchVertices(["orgs"])

// ...is equivalent to
orm.Person.find({})
	.then(vertices => Promise.all(
		vertices.map(v => v.fetchVertices(["orgs"])
	))

// `fetchVertices` can be replaced with `fetchIds` and `fetchCount` in the above example
```

---

# GraphVertex

An instance of the `GraphVertex` class is the default return value for an `Entity` return from the Graph that has been defined in the `Schema` mappings. The purpose of this wrapper is to allow easy maniuplation of the object (e.g. updates/edge connections/deletions etc).

### Accessing Props (`.get()` and `.set()`)

Property access is restricted to `.get(propName)`. To update a property use `.set(propName, newValue)`.

#### Example `get()` and `set()`

```javascript
orm.me().then(myVertex => {
    myVertex.get("username"); // returns current value...
    myVertex.set("username", "Foo");
    const userName = myVertex.get("username"); // returns current "Foo"
});

// `.set()` also accepts an object of changes
orm.me().then(myVertex => {
    myVertex.set({
        firstName: "Foo",
        lastName: "Bar"
    });

    const firstName = myVertex.get("firstName"); // returns current "Foo"
    const lastName = myVertex.get("lastName"); // returns current "Bar"
});
```

Using `.set()` only does not persist the changes to the graph. You have to use `.save()`

### Persisting changes to the Graph (`.save()`)

In order to persist the changes to the graph we need to call the `.save()` method. The returns a promise which resolves to the updated `GraphVertex`. Note: **Your token must have the correct graph permissions to allow this**

#### Example `.save()`

```javascript
orm.me()
    .then(myVertex => {
        return myVertex
            .set({
                firstName: "Foo",
                lastName: "Bar"
            })
            .save();
    })
    .then(updatedMyVertex => {
        //...
    });
```

### Relations Methods (`fetchVertices(<Array> relations)`, `fetchIds(<Array> relations)`,`fetchCount(<Array> relations)`)

The `fetch(Vertices|Ids|Count)` methods load the requested relations data defined in the schema for a given entity. An attempt to fetch a relation not defined in the schema will throw an error.

#### Example:

```javascript
orm.me()
	.then(myVertex =>
		// Trigger relation request for Orgs
		myVertex.fetchVertices(["orgs"])
	.then(myVertexWithOrgs => {
		// Get the Orgs from the updated GraphVertex
		const orgs = myVertexWithOrgs.getRelations("orgs");
	})
```

### Connecting and Disconnect Edges (`.connect()` and `.disconnect()`)

We can connect/disconnect a GraphVertex to/from any of its defined relations`

```javascript
// Connecting a person to an org
Promise.all([orm.Person.findById(personId), orm.Org.findById(orgId)]).then(
    ([personVertex, orgVertex]) => {
        return personVertex.connect(
            "orgs",
            orgVertex
        );
    }
);

// disconnecting a person from an org (example using the org vertex instead)
Promise.all([orm.Person.findById(personId), orm.Org.findById(orgId)]).then(
    ([personVertex, orgVertex]) => {
        return orgVertex.disconnect("members", personVertex);
    }
);
```

### Deleting vertices

Deleting a `GraphVertex` is simply `vertex.delete()` Note: **Your token must have the correct graph permissions to allow this**

```javascript
// Deleting a node
orm.findById(id).then(v => v.delete());
```

### Serialisation

Converting a `GraphVertex` to a plain object is useful for accessing the data in a view layer of your application. The `@hiro-graph/redux` library will do this by default using the `createVerticesSelector` and `createTask::selector()` helpers.

```javascript
const personObj = personVertex.plain(); // Plain object. like `{ _id: "...", _type: "Person", ...}`

// to JSON
const pesonJson = JSON.stringify(personVertex); // .plain() is called internally to strip circular dependencies
```

## Validation

This package contains a library to verify an your local schema mappings match up against a given OGIT schema. OGIT defines an ontology that restricts what attributes and connections a vertex can have, you may create a schema mapping that conflicts with this and this tool helps to identify any problems.

@TODO: The tool only works with YAML ontologies, not the current TTL/RDF format. Also providing a binary would be nice ;).

```javascript
// NODE JS ONLY
const { default: validate } = require("@hiro-graph/orm/lib/schema/validate");

const schema = require("/path/to/your/schema/mappings/array/module");

const ontologyPath = "/path/to/your/OGIT/yaml/directory/or/file";

const result = validate(schema, ontologyPath);

console.log(result); // hopefully { errors: 0, detail: {} }
```

If there are errors, the `detail` object will contain much more information keyed by `ogit/_type`, to help you make the required changes to either the schema or the ontology.

## Codecs: String-to-type mappers

HIRO Graph only allows storing string values, so if we wish to infer more meaningful types to those values we need to encode them. Also, as in the graph all values are strings, in order to sanely sort our values, they need to sort lexically when encoded.

This package cover both those use-cases so you can define mappings for fields with types and have the conversion to and from string values done transparently. Most codecs handle bad input values by providing a zero value in the case

```javascript
const int = codec.int;

console.log(int.encode(101)); // "p0000000000000101"
console.log(int.encode(-101)); // "n9007199254740890"
console.log(int.encode("this is not a number")); // "p0000000000000000"

console.log(int.decode("n9007199254740890")); // -101
console.log(int.decode("I am not a number")); // 0
```
