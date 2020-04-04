import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import Client, { OGIT, lucene, gremlin } from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token =
  'TZ2SVvoj0sHGCqVxy3olxejZb8gtcj3LDhsAQgCyoF7TOjzLoapOUl6guXvF9DDPP8LNZFAntnYF8JB05X8LDpih2gprOUxTRdtNYWgcCvcoYmYObgjCtLHQwNHqvR9Z';

const client = new Client(
  {
    endpoint: 'https://eu-stagegraph.arago.co',
    token,
  },
  { forceHTTP: true },
);

const { querystring, placeholders } = lucene({
  'ogit/_id': 'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
});

const query = gremlin('')
  .inE('ogit/Auth/isMemberOf')
  .has('ogit/_out-type', 'ogit/Auth/Account')
  .outV()
  .count()
  .toString();

const name$ = client
  .lucene(querystring, {
    limit: 1,
    ...placeholders,
  })
  // @ts-ignore
  .pipe(map((res) => res && res.map((r) => r['ogit/name'])));

const members$ = client.gremlin(
  'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
  query,
  {
    limit: 1,
  },
);

forkJoin({
  name: name$,
  members: members$,
}).subscribe(console.log);
