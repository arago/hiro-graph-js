import { extract } from '../src/utils';

type O = Record<string, any>;

test('Extract keys to object', () => {
  const tests: Array<[O, string[], O]> = [
    [
      {
        a: 1,
        b: 1,
        c: 1,
      },
      ['b'],
      {
        b: 1,
      },
    ],
    [
      {
        a: 1,
        b: 1,
        c: 1,
      },
      ['a', 'b', 'c'],
      {
        a: 1,
        b: 1,
        c: 1,
      },
    ],
    [
      {
        a: 1,
        b: 1,
        c: 1,
      },
      [],
      {},
    ],
    [
      {
        b: 1,
      },
      ['a', 'b'],
      {
        b: 1,
      },
    ],
  ];

  tests.forEach(([input, arg, expected]) => {
    expect(extract(input, ...arg)).toEqual(expected);
  });
});
