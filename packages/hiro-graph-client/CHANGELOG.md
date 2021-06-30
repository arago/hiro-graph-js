# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add `Endpoint` helper class for easy creation of API urls and queries. Additional endpoints can be passed in.

  ```ts
  const url = new Endpoint('https://graphit.co').api('auth', ['me', 'account'], {
    profile: true,
  });
  // https://graphit.co/api/auth/6.1/me/account?profile=true
  ```
- Gremlin query supports `fields` argument as 3rd parameter. Limits the returned attributes.
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

- Added `JFilter` helpers for working with Eventstreams
  
  ```ts
  const filter = JFilter.and(
    JFilter.equals('element.ogit/_type', 'ogit/Mobile/HealthInfo'),
    JFilter.equals('action', '*'),
  );
  ```

  Response bodies can be transformed to filter format, and tested:

  ```ts
  filter.test(JFilter.transform(res))
  ```

### Changed

- Convert to Typescript
- Re-write Transports (and Eventstream) using RxJS - All functions now return `Observable<T>` these can be converted to Promises using `toPromise()`. Note: `toPromise()` returns `T|T[]` as multiple results may be returned from websocket. 
  ```ts
  const res = await toPromise(client.lucene({ '/hello': 'world' }));
  ```
- Eventstream uses JFilter to filter out results. This means multiple filters can be used, without results being mixed together.
  
  ```ts
  const issueFilter = JFilter.and(
    JFilter.equals('element.ogit/_type', 'ogit/Automation/AutomationIssue'),
    JFilter.equals('action', '*'),
  );

  const accountFilter = JFilter.and(
    JFilter.equals('element.ogit/_type', 'ogit/Auth/Account'),
    JFilter.equals('action', '*'),
  );

  const es = client.eventStream();

  es.register(issueFilter).subscribe(console.log); // Will only get issues
  es.register(accountFilter).subscribe(console.log); // Will only get accounts
  ```

### Removed

- Remove internal un-used code - such as dedup, extra logging, internal emitting of events etc.
- Remove internal default exports for consistency.
