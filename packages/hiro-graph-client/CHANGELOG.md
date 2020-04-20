# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Convert to Typescript
- Add `Endpoint` helper class for easy creation of API urls and queries.

```ts
const url = new Endpoint('https://graphit.co').api('auth', ['me', 'account'], {
  profile: true,
});
// https://graphit.co/api/auth/6.1/me/account?profile=true
```

- Re-write Transports (and Eventstream) using RxJS - All functions now return `Observable<T[]>` these can be converted to Promises using `toPromise()`.
- `InstanceType<Client>.gremlin()` and `InstanceType<Client>.lucene()` now have built in query helpers to reduce code when using these functions.

```ts
// Gremlin Query
import Client, { gremlin } from '@hiro-graph/client';

const client = new Client(...);
const query = gremlin('').inE(12345).outV().toString();

client.gremlin('12345', query);


// Lucene Query
import Client, { lucene } from '@hiro-graph/client';

const client = new Client(...);
const { querystring, placeholders } = lucene({ '/hello': 'world' })

client.lucene(querystring, { ...placeholders });
```

Can now be written as:

```ts
// Gremlin Query
import Client from '@hiro-graph/client';

const client = new Client(...);

client.gremlin('12345', g => g.inE(12345).outV())

// Lucene Query
import Client from '@hiro-graph/client';

const client = new Client(...);

client.lucene({ '/hello': 'world' });
```

- Remove internal un-used code - such as dedup, extra logging, internal emitting of events etc.
- Remove internal default exports for consistency.
