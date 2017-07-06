/*
https://github.com/arago/hiro-graph-js/issues/35

Hi, I am trying to query Vertices with limit and offset:

res.fetchVertices(['notifications'], { offset: 0, limit: 5 })

But in the network panel there is no sign of these being applied.

I briefly looked into it:
We use http and I followed the request until here:
https://github.com/arago/hiro-graph-js/blob/5c3d734496aa457746538d336f5d80903aa75a54/packages/hiro-graph-client/src/transport-http.js#L15

It seems the reqOptions is not used.

===

Analysis, the problem exists but not for this reason.
The limit/offset in Gremlin need to be set in the query.
Not passed to the `request` function.

So it is the relation methods that need to change.
But first a test to verify
*/
/* eslint-env jest */

import schema from "../__mocks__/schema";
import Context from "../src/index";
import createMockClient from "hiro-graph-client/lib/mock";

const client = createMockClient();
const ctx = new Context(client, schema);

const knownDate = 14e11;

describe("github issue 35", () => {
    const vtx = ctx.insert({
        _id: "some-id",
        _type: "Simple",
        "_created-on": knownDate,
        "_modified-on": knownDate + 1,
        "_created-by": "some-creator",
        "_modified-by": "some-modifier",
        _content: "some-content",
        _tags: ["a", "comma-seperated", "list", "of tags"]
    });

    const tests = [
        {
            name: "offset and limit",
            options: { offset: 1, limit: 2 },
            match: /\[1\.\.3\]/
        },
        {
            name: "limit only",
            options: { limit: 5 },
            match: /\[0\.\.5\]/
        },
        {
            name: "offset only",
            options: { offset: 10 },
            match: /\[10\.\.Integer.MAX_VALUE\]/
        }
    ];

    tests.forEach(({ name, options, match }) => {
        it(
            "`fetchVertices` with should produce the correct queries with " +
                name,
            async () => {
                // now run the query
                client.enqueueMockResponse([{}]);
                await vtx.fetchVertices(["simpleOutbound"], options);
                expect(client.retrieveLastRequest().body.query).toMatch(match);
            }
        );
    });
});
