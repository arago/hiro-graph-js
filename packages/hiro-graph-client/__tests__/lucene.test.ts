/* eslint-env jest */
/**
 *  Testing the Lucene Query Generator
 */
import {
  lucene as parse,
  getPlaceholderKeyForIndex,
  Lucene,
} from '../src/lucene';

describe('Lucene Query Generator:', function () {
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
      input: { $range: { prop: [1, 5] as [number, number] } },
    },
    {
      name: '$search',
      input: { $search: `test "quoted term"` },
    },
    {
      name: '$or with $search',
      input: { $or: { '/target': 'test', $search: 'test2' } },
    },
    {
      name: 'wildcard',
      input: { '/a': 'test*', '/b': '*test', '/c': '*test*' },
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
          $search: 'or search',
        },
        $missing: ['key13', 'key14'],
        $search: 'test "quoted term"',
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
    {
      name: 'long ngram',
      input: {
        $search:
          'this is a really long message, this wont split because of spaces',
      },
    },
    {
      name: 'ngram quoted',
      input: {
        $search: 'this is a quoted "message"',
      },
    },
    {
      name: 'ngram special',
      input: {
        $search:
          'ZTE_vEMS_1_U31_OMMOID=jorand1b-c#@#%#611-308111-1_1_1_1_198094420_327680_1602716595130-1603329369065',
      },
    },
    {
      name: 'long ngram split',
      input: {
        $search:
          'asdksdfidfhdffs423423dxisepfksdklgdlijpsdmgld456456fsdfsfesfdfsefsdfsefsdfsef1231435675ugljl',
      },
    },
    {
      name: 'long ngram split manual',
      input: {
        'ogit/_content.ngram':
          'asdksdfidfhdffs423423dxisepfksdklgdlijpsdmgld456456fsdfsfesfdfsefsdfsefsdfsef1231435675ugljl',
      },
    },
  ];

  tests.forEach(
    ({
      name,
      input,
      placeholders = [],
    }: {
      name: string;
      input: Lucene.Query;
      placeholders?: any[];
    }) => {
      it(name, function () {
        if (input) {
          const actual = parse(input);

          expect(actual.querystring).toMatchSnapshot();
          expect(actual.placeholders).toMatchSnapshot();
          placeholders.forEach((p, i) => {
            expect(actual.placeholders[getPlaceholderKeyForIndex(i)]).toEqual(
              p,
            );
          });
        }
      });
    },
  );
});
