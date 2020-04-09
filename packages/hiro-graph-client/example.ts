import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import Client, { Servlets } from './src';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token =
  'TDsmg5Y4mJjUjM3tVeSjlVnpae2knHOKgx483WU2Z847k38OVuFN3cfk2aRVtF17rJejIgXsJZRTiaBcywH7RNsO047JpRKtjQdPhYxRCpf6chk3JWiZcJuWXZFsRyDi';

const client = new Client({
  endpoint: 'https://eu-stagegraph.arago.co',
  token,
}).addServlet(Servlets.Variables);

client.variables.add({}).subscribe(console.log);

// const issueFilter = new StreamFilter().and(
//   `element.ogit/_type = ogit/Automation/AutomationIssue`,
//   'action = UPDATE',
// );

// const es = client.eventStream();

// // @ts-ignore
// es.subscribe(console.log);

// es.register(issueFilter).subscribe(console.log);

const name$ = client
  .lucene(
    {
      'ogit/_id': 'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
    },
    {
      limit: 1,
    },
  )
  // @ts-ignore
  .pipe(map((res) => res && res.map((r) => r['ogit/name'])));

const members$ = client.gremlin(
  'cjuwixjvq0xfc1q90xqn8jsvf_ck74voksj077n0w46k0cf09xo',
  (g) =>
    g
      .inE('ogit/Auth/isMemberOf')
      .has('ogit/_out-type', 'ogit/Auth/Account')
      .outV()
      .count(),
);

forkJoin({
  name: name$,
  members: members$,
}).subscribe(console.log);

// TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' yarn ts-node example.ts
