import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import Client, { lucene, gremlin } from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token =
  'vwcv0ofygAZbhAXmJxeaiBMdaTgK5o49MGh21YXTFVKYoAvMaOvbCMr7xJEUtbo81YkMyscheudyHUyEIp38vo74qr2KDBMAngSd6XDy0mRDkMeAVUhL0AA02wbE2SwK';

const client = new Client({
  endpoint: 'https://eu-stagegraph.arago.co',
  token,
});

// const issueFilter = new StreamFilter().and(
//   `element.ogit/_type = ogit/Automation/AutomationIssue`,
//   'action = UPDATE',
// );

// const es = client.eventStream();

// // @ts-ignore
// es.subscribe(console.log);

// es.register(issueFilter).subscribe(console.log);

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
