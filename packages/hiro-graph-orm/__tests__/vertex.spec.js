/* eslint-env jest */
import Vertex from '../src/vertex';

describe('Vertex', function() {
    const testVertexInitialData = {
        _type: 'Test',
        _id: 'test@vertex',
        foo: 'bar',
        baz: 1,
    };

    const testRelationIds = ['a', 'b', 'c'];
    const testRelationObjects = testRelationIds.map((id) => ({
        _id: id,
        _type: 'test',
    }));

    const testVtx = new Vertex(testVertexInitialData);

    it("should know it's id", () => {
        expect(testVtx._id).toEqual('test@vertex');
    });

    it("should know it's type", () => {
        expect(testVtx.type()).toEqual('Test');
    });

    it('should be able to fetch props', () => {
        expect(testVtx.get('foo')).toEqual('bar');
    });

    it('should be able to update props', () => {
        testVtx.set('foo', 'baz');
        expect(testVtx.get('foo')).toEqual('baz');
    });

    it('should not be care about mutations to the original data', () => {
        expect(testVertexInitialData.foo).toEqual('bar');
        testVertexInitialData.baz = 'not one any more';
        expect(testVtx.get('baz')).toEqual(1);
    });

    it('should retain initial values', () => {
        expect(testVtx._before.foo).toEqual('bar');
        testVtx.set({ foo: 'boom' });
        expect(testVtx._before.foo).toEqual('bar');
    });

    it('should be able to add and read relation data', () => {
        testVtx.setVertices('rel', testRelationObjects);
        expect(testVtx.getIds('rel')).toEqual(testRelationIds);
        expect(testVtx.getCount('rel')).toEqual(testRelationIds.length);
    });

    it('should be able to serialize itself', () => {
        const serial = testVtx.plain();

        Object.keys(serial).forEach((key) => {
            switch (key) {
                case '_rel':
                    expect(serial._rel).toHaveProperty(
                        'relIds',
                        testVtx.getIds('rel'),
                    );
                    expect(serial._rel).toHaveProperty(
                        'relCount',
                        testVtx.getCount('rel'),
                    );
                    break;
                case '_free':
                    expect(serial._free).toEqual({});
                    break;
                default:
                    expect(testVtx.get(key)).toEqual(serial[key]);
            }
        });
    });
});
