# `hiro-graph-gremlin`: Gremlin Query Builder for HIRO Graph

Provides an imperative interface for building and composing Gremlin queries for use with the HIRO Graph API.

## installation

```bash
$ npm install hiro-graph-gremlin
```

## usage

```javascript
import queryBuilder, { T, long } from "hiro-graph-gremlin";


const query = queryBuilder();

query.outE("edge")
    .has("ogit/_in-type", "ogit/Foo")
    .hasNot("ogit/_created-on", T.lt, long(Date.now()-1000))

```

## missing features

 - placeholder support
