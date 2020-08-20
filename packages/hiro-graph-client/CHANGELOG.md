# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.4.0-rc.1]

### Added

- Add `Endpoint` helper class for easy creation of API urls and queries. Additional endpoints can be passed in.

```ts
const url = new Endpoint('https://graphit.co').api('auth', ['me', 'account'], {
  profile: true,
});
// https://graphit.co/api/auth/6.1/me/account?profile=true
```

- `InstanceType<Client>.gremlin()` and `InstanceType<Client>.lucene()` now have built in query helpers to reduce code when using these functions.

```ts
// Gremlin Query

// -- Before
import Client, { gremlin } from '@hiro-graph/client';

const client = new Client(...);
const query = gremlin('').inE(12345).outV().toString();

client.gremlin('12345', query);

// -- After
import Client from '@hiro-graph/client';

const client = new Client(...);

client.gremlin('12345', g => g.inE(12345).outV())



```

Can now be written as:

```ts
// Lucene Query

// -- Before
import Client, { lucene } from '@hiro-graph/client';

const client = new Client(...);
const { querystring, placeholders } = lucene({ '/hello': 'world' })

client.lucene(querystring, { ...placeholders });

// -- After
import Client from '@hiro-graph/client';

const client = new Client(...);

client.lucene({ '/hello': 'world' });
```

### Changed

- Convert to Typescript
- Re-write Transports (and Eventstream) using RxJS - All functions now return `Observable<T[]>` these can be converted to Promises using `toPromise()`.

### Removed

- Remove internal un-used code - such as dedup, extra logging, internal emitting of events etc.
- Remove internal default exports for consistency.
