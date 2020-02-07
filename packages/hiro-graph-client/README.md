# `@hiro-graph/client`: HIRO Graph API Client Javascript Library

This is an isomorphic HIRO Graph Client library which exports, by default a `Client` and a named export: `Token`.

## installation

```bash
$ npm install @hiro-graph/client
```

## Client

This is a client which performs the API calls against the HIRO Graph API for you, mantaining a persistent connection to the server. It will work with WebSockets if possible, but falls back to HTTP if not. It requires a `Token` which will then be used for all requests. All Exposed API methods return `Promise`s.

```javascript
import Client from '@hiro-graph/client';

const client = new Client({
  endpoint: 'http://localhost:8888',
  token: someTokenInstance,
});
```

The second argument to Client can be a `Transport` if you have a custom one, or a set of options for the client. If websockets are available, i.e. most modern browsers and when in node.js, then the default transport is a pool of websockets. The pool only has one socket by default, as in the browser this is most likely what you want, however on the backend you may wish to up this to more than a single connection.

```javascript
import Client from '@hiro-graph/client';

const client = new Client(
  {
    endpoint: 'http://localhost:8888',
    token: someTokenInstance,
  },
  {
    poolSize: 10,
  },
);
```

## Token

Is an Access Token for HIRO Graph, and the mechanics to retrieve/update itself.
I.e. it knows how to get a token and what to do when the token is considered invalidated.

The API is simple, you create a token with a function `getToken` that returns a promise for an access token. Additionally you can pass an `onInvalidate` callback that, as the name suggests, is called when the token has been deemed invalidated.

```javascript
import { Token } from "@hiro-graph/client";

// Simple fixed token.
const fixedTok = new Token({ getToken: () => "some token" });

// Using fetch http call to get an access token
const asyncTok = new Token({ getToken: () => {
    return fetch({ ... }).then(res => res.json()).then(json => json.access_token);
}});
```

More information on authenticating against the HIRO IAM can be found in the [HIRO Docs](https://docs.hiro.arago.co/hiro/current/developer/hiro-graph-api/index.html#how-to-get-a-token)

## Servlets

HIRO Graph exposes many plugins via `/_*` endpoints (as HTTP) and only the most common APIs are exposed here. See the [servlets](/src/servlets/) directory for more info.

In order to make arbitrary HTTP requests (with a valid Token) against HIRO Graph you can use `Client.http.fetch` (and `Client.http.defaultOptions()`) which acts just like the regular `fetch` API, but automatically adds the Access Token.

```javascript
const options = client.http.defaultOptions();
options.method = 'POST';
options.body = '{ "some": "data" }';
const url = '/_some/uri';
conn.http.fetch(url, options).then((res) => {
  //...
});
```

## Gremlin

Gremlin Query Builder for HIRO Graph, provides an imperative interface for building and composing Gremlin queries for use with the HIRO Graph API.

```javascript
import { gremlin } from '@hiro-graph/client';

const query = gremlin('')
  .inE('ogit/relates')
  .has('ogit/_out-type', 'ogit/Automation/AutomationIssue')
  .inV()
  .toString();

client.gremlin('an-id', query);
```

## Lucene

Query Builder for Lucene Query Parser Syntax

That is: a custom DSL which translates to Lucene Query Parse Syntax which can be sent over the wire to be translated back into native Lucene queries for execution.

Lucene Query Parser Syntax is complex ([see for yourself](http://lucene.apache.org/core/4_6_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Overview)). So to ease development, we have an abstraction.

### Basic Syntax

The abstraction is basically a Javascript Object whose `keys` are the fields to query, and whose `values` are the terms to query for. To specify multiple values for a field, simply pass an array as the value.

```javascript
import { lucene } from '@hiro-graph/client';

//simple example (note we pass in the person entity for the translation)
const { querystring, placeholders } = parse({
  'ogit/_type': 'ogit/Automation/KnowledgeItem',
});

console.log(querystring); // -> `+ogit\\/_type:"ogit\\/Automation\\/KnowledgeItem"`

client.lucene(querystring, { limit: 1, ...placeholders });
```

### Special keys

To assist with the more complex lucene syntax we introduce some (mongodb inspired) special keys:

- `$or`: switch to "one or more of these conditions".
- `$and`: switch to "all of these conditions" (the default, but allows to switch back once in `$or` or `$not`) (aliased as `$must` as well).
- `$not`: switch to "must not match these conditions".
- `$range`: create a condition where matches must be in the given range.
- `$missing`: create a condition which matches the presence of a field.
- `$search`: helper for more complex matching

A couple of these will need more explanation. Otherwise the test code is a good place to look.

#### `$range` queries

```javascript
//find users with names starting with "a" or "b" (and the name "c" itself).
//ranges are inclusive and most fields are strings, so lexical sorting applies
const query = {
  $range: {
    '/freeAttribute': ['a', 'c'],
  },
};

//some fields like the internal `ogit/_modified-on` field is actually numeric
//find everything modified in the last day
const query = {
  $range: {
    'ogit/_modified-on': [+new Date() - 86400, +new Date()],
  },
};
```

#### `$search` queries

Search is tricky. Before I get into the syntax, I need to explain a couple of concepts, and it would be good to get the terminology straight.

- `source`: the originally indexed JSON
- `key`: an object key of the `source` document
- `value`: the value (or values) of the data in the `source` at a given `key`
- `field`: a mapping in lucene representing the data in the `source` at some `key`
- `term`: a value stored for a `field` in lucene
- `tokenizer`: a process by which a `value` is converted into one or more tokens (e.g. "split on whitespace")
- `analyzer`: a process by which `tokens` are further reduced into `terms`, e.g. a stemming algorithm, or a lowercasing

With this in mind, in HIRO Graph's lucene index for vertices all `keys` in a `source` except for a few special internal ones, are NOT tokenised, NOR analyzed on indexing. The queries you send are NOT tokenised NOR analysed before search either, making these fields very predictable.

All fields are assumed to be (and coerced into) strings except for the following:

- `ogit/_is-deleted` => `boolean`
- `ogit/_created-on`, `ogit/_modified-on`, `ogit/_deleted-on` => `date`

The fields that have more complex analysis/mappings are important:

##### `ogit/_tags`

This field is not handled in a special way by lucene, but GraphIT splits the string into a list comma-seperated values before sending for index, so lucene see's multiple `values` for the `key`.

In practice this means that you can search for `"bar"` in a `source` with `value` `"foo, bar, quux"` and it will match because `"bar"` is one of the `terms` in the `field` `"ogit/_tags"`.

Queries to this field are not `analysed` and so should be predictable.

##### `ogit/_content`

This field maps the key `ogit/_content` and is analysed in a more complex way.

So currently it uses the `standard` analyser ([elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-standard-analyzer.html)), which is a generic english/european language based analyser.

Note that queries to this field are also analysed with the `standard` analyser! So results may not be what you expect.

##### `ogit/_content.ngram`

This field maps the same `key` but with a different analyser. This is a custom analyser (see the above GitHub link). It performs the following on inbound data

1.  transform to lowercase
2.  perform stemming filter "light_english" (see [this](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-stemmer-tokenfilter.html) and [this - if you must](http://ciir.cs.umass.edu/pubfiles/ir-35.pdf))
3.  split into ngrams, min length 2, max length 10, on character sets "letters" and "digits" (see [ngrams](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-ngram-tokenizer.html)).

Queries sent in are `analysed` with the standard analyser.

##### So, `$search`

Now you have ingested all that complexity, here's how create a search query.

```javascript
// by default, searches `ogit/_content.ngram`
const query = {
  $search: 'foo',
};

//but you can specify the search type as "prefix" to enable prefix searching on a specific field.
const prefixQuery = {
  $search: {
    term: 'foo',
    type: 'prefix',
    field: 'username',
  },
};
// note that the prefix search will NOT match a term "foo" only, "foo-something", ie. not the prefix itself, but the prefix AND more.
```
