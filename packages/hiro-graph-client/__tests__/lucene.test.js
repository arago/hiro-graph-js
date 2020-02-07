/* eslint-env jest */
/**
 *  Testing the Lucene Query Generator
 */
import parse, { getPlaceholderKeyForIndex } from '../src/lucene';

describe('Lucene Query Generator:', function() {
    const tests = [
        {
            name: 'single field',
            input: { 'ogit/_id': 'xyz' },
        },
        {
            name: 'multiple field',
            input: {
                'ogit/_id': 'xyz',
                'ogit/_type': 'ogit/Comment',
            },
        },
        {
            name: 'multiple values (as and)',
            input: {
                field: ['value1', 'value2'],
            },
        },
        {
            name: '$not',
            input: { $not: { field: 'value' } },
        },
        {
            name: '$not (multi value)',
            input: { $not: { prop: ['test', 'not'] } },
        },
        {
            name: '$or (single value, trick question!)',
            input: { $or: { prop: 'test' } },
        },
        {
            name: '$or (multiple. same key)',
            input: { $or: { prop: ['test', 'value'] } },
        },
        {
            name: '$or (multiple. diff key)',
            input: { $or: { prop: 'test', anotherProp: 'this too' } },
        },
        {
            name: '$missing (single)',
            input: { $missing: 'prop' },
        },
        {
            name: '$missing (multiple)',
            input: { $missing: ['prop', 'anotherProp'] },
        },
        {
            name: '$range',
            input: { $range: { prop: [1, 5] } },
        },
        {
            name: '$search',
            input: { $search: `test "quoted term"` },
        },
        {
            name: 'extreme example',
            input: {
                key1: 'value',
                key2: ['multi', 'value'],
                $not: {
                    key4: 'not',
                    key5: ['not', 'multi'],
                    $range: {
                        key6: ['notFrom', 'notTo'],
                        key7: ['second', 'range'],
                    },
                    $or: { key8: ['not', 'or', 'values'] },
                },
                $or: {
                    key9: 'or this',
                    key10: ['two', 'terms'],
                    $not: {
                        key11: 'nor this',
                    },
                    $missing: 'key12',
                    $search: { type: 'ngram', term: 'or search' },
                },
                $missing: ['key13', 'key14'],
                $search: { type: 'ngram', term: 'test "quoted term"' },
            },
        },
        {
            name: 'strings with quotes',
            input: { prop: 'test " quoted' },
        },
        {
            name: 'strings with existing slashes',
            input: { prop: 'test \\ slashed' },
        },
        {
            name: 'strings with exsiting slashed quotes',
            input: { prop: 'test \\" slashquoted' },
        },
    ];

    tests.forEach(({ name, input, placeholders = [] }) => {
        it(name, function() {
            if (input) {
                const actual = parse(input);

                expect(actual.querystring).toMatchSnapshot();
                placeholders.forEach((p, i) => {
                    expect(
                        actual.placeholders[getPlaceholderKeyForIndex(i)],
                    ).toEqual(p);
                });
            }
        });
    });
});
