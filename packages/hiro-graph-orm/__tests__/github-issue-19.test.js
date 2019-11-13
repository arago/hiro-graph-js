/* eslint-env jest */

import schema from '../__mocks__/schema';
import Context from '../src/index';
import createMockClient from '@hiro-graph/client/lib/mock';

const client = createMockClient();
const ctx = new Context(client, schema);

/**
 * Validating Bug: https://github.com/arago/hiro-graph-js/issues/19
 */

describe('https://github.com/arago/hiro-graph-js/issues/19', () => {
    it('should not error when calling the `gremlin().relation` method', async () => {
        let q;

        expect(
            () => (q = ctx.gremlin().relation('Simple', 'simpleOutbound')),
        ).not.toThrow();

        const response = {};

        client.enqueueMockResponse(response);
        await expect(q.execute('foo', { raw: true })).resolves.toBe(response);
    });
});
