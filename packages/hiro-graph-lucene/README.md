# `hiro-graph-lucene`: Query Builder for Lucene Query Parser Syntax

That is: a custom DSL which translates to Lucene Query Parse Syntax which can be sent over the wire to be translated back into native Lucene queries for execution.

Lucene Query Parser Syntax is complex ([see for yourself](http://lucene.apache.org/core/4_6_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#Overview)). So to ease development, we have an abstraction.

This package is used internally by `hiro-graph-orm` but may well have use outside of that.


## Installation

```
$ npm install hiro-graph-lucene
```

## Usage


### Basic Syntax

The abstraction is basically a Javascript Object whose `keys` are the fields to query, and whose `values` are the terms to query for. To specify multiple values for a field, simply pass an array as the value.

```javascript
import parse from "hiro-graph-lucene";

//simple example (note we pass in the person entity for the translation)
const { querystring } = parse({ "ogit/alternativeName": "thechriswalker" });
console.log(querystring); // -> `+ogit/alternativeName:"thechriswalker"`
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
        "/freeAttribute": ["a", "c"]
    }
}

//some fields like the internal `ogit/_modified-on` field is actually numeric
//find everything modified in the last day
const query = {
    $range: {
        "ogit/_modified-on": [+new Date() - 86400, +new Date()]
    }
}
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

 1. transform to lowercase
 2. perform stemming filter "light_english" (see [this](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-stemmer-tokenfilter.html) and [this - if you must](http://ciir.cs.umass.edu/pubfiles/ir-35.pdf))
 3. split into ngrams, min length 2, max length 10, on character sets "letters" and "digits" (see [ngrams](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-ngram-tokenizer.html)).

Queries sent in are `analysed` with the standard analyser.

##### So, `$search`

Now you have ingested all that complexity, here's how create a search query.

```javascript
// by default, searches `ogit/_content.ngram`
const query = {
    $search: "foo"
}

//but you can specify the search type as "prefix" to enable prefix searching on a specific field.
const prefixQuery = {
    $search: {
        term: "foo",
        type: "prefix",
        field: "username"
    }
}
// note that the prefix search will NOT match a term "foo" only, "foo-something", ie. not the prefix itself, but the prefix AND more.
```
