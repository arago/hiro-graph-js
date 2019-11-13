/* eslint-env jest */
import schema from '../__mocks__/schema';
import Context from '../src/index';
import createMockClient from '@hiro-graph/client/lib/mock';

const cache = new Map();
const client = createMockClient();
const ctx = new Context(client, schema, cache);

const reset = () => {
    cache.clear();
    client.resetMockTransport();
};

const simpleTestNodeGenerator = (id) => ({
    'ogit/_id': id,
    'ogit/_type': 'ogit/Simple',
    'ogit/requiredProp': 'this-is-required',
    'ogit/someOtherProp': 'some-other-prop',
    'ogit/optionalProp': 'this-is-optional',
});

describe('mock transport test', () => {
    beforeEach(reset);

    it('should allow queries to work', () => {
        client.enqueueMockResponse(simpleTestNodeGenerator('test-id'));

        return ctx.Simple.findById('test-id').then((res) => {
            expect(res._id).toBe('test-id');
            expect(res.plain().prop).toBe('this-is-required');
            expect(client.retrieveLastRequest()).toMatchObject({
                type: 'query',
                headers: { type: 'vertices' },
                body: {
                    query: `+ogit\\/_type:"ogit/Simple" +ogit\\/_id:"test-id"`,
                },
            });
        });
    });

    it('should verify bug on connect/disconnect relation fail when going to 0 relations, then connecting', () => {
        //client.debugMockRequests(true);
        //get a vertex, with relations, the connect/disconnect.
        const node1 = simpleTestNodeGenerator('node-1');
        const node2 = simpleTestNodeGenerator('node-2');
        const node3 = simpleTestNodeGenerator('node-3');
        const relation = 'simpleSameType';

        client.enqueueMockResponse(
            node1, // this is the initial find by id response
            [node2], //this is the fetchVertices gremlin query response
            { delete: true }, // this is the disconnect result (ignored)
            [], //this is the fetchVertices gremlin query response refetching after delete
            { edge: true }, // this is the reconnect result (ignored)
            [node3], //this is the fetchVertices gremlin query response, refetching after connect
        );

        // boom!
        return ctx.Simple.findById('node-1')
            .then(ctx.fetchVertices([relation]))
            .then((res) => {
                expect(res.plain()._rel[relation + 'Ids']).toEqual(['node-2']);

                return res;
            })
            .then((res) => res.disconnect(relation, 'node-2'))
            .then((res) => {
                expect(res.plain()._rel[relation + 'Ids']).toEqual([]);

                return res;
            })
            .then((res) => res.connect(relation, 'node-2'))
            .then((res) => {
                expect(res.plain()._rel[relation + 'Ids']).toEqual(['node-3']);

                return res;
            });
    });

    it('should convert `order` to OGIT props on `find` queries', async () => {
        const node1 = simpleTestNodeGenerator('node-1');

        // find, findOne,
        client.enqueueMockResponse([node1]);
        await ctx.Simple.find({}, { order: ['prop asc'] });
        expect(client.retrieveLastRequest().body.order).toBe(
            'ogit/requiredProp asc',
        );
        client.enqueueMockResponse([node1]);
        await ctx.Simple.find({}, { order: ['ogit/requiredProp asc'] });
        expect(client.retrieveLastRequest().body.order).toBe(
            'ogit/requiredProp asc',
        );
        client.enqueueMockResponse(node1);
        await ctx.Simple.findOne({}, { order: ['prop asc'] });
        expect(client.retrieveLastRequest().body.order).toBe(
            'ogit/requiredProp asc',
        );
        client.enqueueMockResponse(node1);
        await ctx.Simple.findOne({}, { order: ['ogit/requiredProp asc'] });
        expect(client.retrieveLastRequest().body.order).toBe(
            'ogit/requiredProp asc',
        );

        // if the prop is not a real prop, ignore.
        client.enqueueMockResponse(node1);
        await ctx.Simple.findOne({}, { order: ['notARealProp asc'] });
        expect(client.retrieveLastRequest().body.order).toBe(
            'notARealProp asc',
        );
    });

    it('should force limit to 1 when performing a `findOne`', async () => {
        const node1 = simpleTestNodeGenerator('node-1');

        client.enqueueMockResponse([node1]);
        await ctx.Simple.findOne({});
        expect(client.retrieveLastRequest()).toMatchObject({
            body: { limit: 1 },
        });
    });
});
