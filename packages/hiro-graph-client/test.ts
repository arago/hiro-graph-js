import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import Client, { OGIT, lucene, gremlin } from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token =
  'V14MoAZSt5FsyIeElZRkMxu0UgbikbqI6peFA5ZUcMGAkiw0Lp794FNpSxPhyt9zL2Fsey5Z2ejAh5X8krQOY4UmRq8PN5TiG2GL9uTNWVnVPkpFaqaNqmmOg868ta2W';

const client = new Client({
  endpoint: 'https://eu-stagegraph.arago.co',
  token,
});

const { querystring, placeholders } = lucene({
  'ogit/_id': 'cjuwixjvq0xfc1q90xqn8jsvf_cjuwixjvq0xfg1q90asxz9lba',
});

const query = gremlin('')
  .inE('ogit/Auth/isMemberOf')
  .has('ogit/_out-type', 'ogit/Auth/Account')
  .outV()
  .count()
  .toString();

const id$ = client
  .lucene(
    querystring,
    {
      limit: 1,
      ...placeholders,
    },
    {
      asStream: true,
    },
  )
  // @ts-ignore
  .pipe(map((res) => res['ogit/_id']));

const count$ = client.gremlin(
  'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
  query,
  {
    limit: 1,
    asStream: true,
  },
);

forkJoin({
  id: id$,
  count: count$,
}).subscribe(console.log);
