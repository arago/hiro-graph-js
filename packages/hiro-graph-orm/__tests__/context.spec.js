/* eslint-env jest */
import schema from "../__mocks__/schema";
import Context from "../src/index";
import createMockClient from "hiro-graph-client/lib/mock";

const cache = new Map();
const client = createMockClient();
const ctx = new Context(client, schema, cache);

const reset = () => {
    cache.clear();
    client.resetMockTransport();
    client.debugMockRequests(false);
};

const simpleTestNodeGenerator = id => ({
    "ogit/_id": id,
    "ogit/_type": "ogit/Simple",
    "ogit/requiredProp": "this-is-required",
    "ogit/someOtherProp": "some-other-prop",
    "ogit/optionalProp": "this-is-optional"
});

describe("mock transport test", () => {
    beforeEach(reset);

    it("should allow queries to work", () => {
        client.enqueueMockResponse(simpleTestNodeGenerator("test-id"));
        return ctx.Simple.findById("test-id").then(res => {
            expect(res._id).toBe("test-id");
            expect(res.plain().prop).toBe("this-is-required");
            expect(client.retrieveLastRequest()).toMatchObject({
                type: "query",
                headers: { type: "vertices" },
                body: {
                    query: `+ogit\\/_type:"ogit/Simple" +ogit\\/_id:"test-id"`
                }
            });
        });
    });

    it("should verify bug on connect/disconnect relation fail", () => {
        //client.debugMockRequests(true);
        //get a vertex, with relations, the connect/disconnect.
        const node1 = simpleTestNodeGenerator("node-1");
        const node2 = simpleTestNodeGenerator("node-2");
        const node3 = simpleTestNodeGenerator("node-3");
        const relation = "simpleSameType";
        client.enqueueMockResponse(
            node1, // this is the initial find by id response
            [node2, node3], //this is the fetchVertices gremlin query response
            { delete: true }, // this is the disconnect result (ignored)
            [node3], //this is the fetchVertices gremlin query response refetching after delete
            { edge: true }, // this is the reconnect result (ignored)
            [node2, node3] //this is the fetchVertices gremlin query response, refetching after connect
        );
        // boom!
        return ctx.Simple
            .findById("node-1")
            .then(ctx.fetchVertices([relation]))
            .then(res => {
                expect(res.plain()._rel[relation + "Ids"]).toEqual([
                    "node-2",
                    "node-3"
                ]);
                return res;
            })
            .then(res => res.disconnect(relation, "node-2"))
            .then(res => {
                expect(res.plain()._rel[relation + "Ids"]).toEqual(["node-3"]);
                return res;
            })
            .then(res => res.connect(relation, "node-2"))
            .then(res => {
                expect(res.plain()._rel[relation + "Ids"]).toEqual([
                    "node-2",
                    "node-3"
                ]);
                return res;
            });
    });
});
