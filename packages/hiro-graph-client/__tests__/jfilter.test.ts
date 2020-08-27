import { JFilter } from '../src/jfilter';

test('JFilter snapshots', () => {
  const tests = [
    JFilter.and(JFilter.equals('a', 'b'), JFilter.equals('d', 'e')),
    JFilter.or(JFilter.equals('a', 'b'), JFilter.equals('d', 'e')),
    JFilter.and(JFilter.equals('a', 'b'), JFilter.equals('d', 'e')),
    JFilter.and(
      JFilter.equals('a', 'b'),
      JFilter.or('e=f'),
      JFilter.and(JFilter.equals('d', 'c'), JFilter.equals('g', 'f')),
    ),
  ];

  tests.map((t) => expect(t.toString()).toMatchSnapshot());
});

test('JFilter functions', () => {
  expect(JFilter.equals('a', 'b').toString()).toBe('(a=b)');
  expect(JFilter.and('a', 'b').toString()).toBe('&(a)(b)');
  expect(JFilter.or('a', 'b').toString()).toBe('|(a)(b)');
});

test('JFilter nested', () => {
  expect(JFilter.and('a', JFilter.and('b', 'c')).toString()).toBe(
    '&(a)(&(b)(c))',
  );
  expect(JFilter.or('a', JFilter.or('b', 'c')).toString()).toBe(
    '|(a)(|(b)(c))',
  );
});

test('JFilter transform', () => {
  expect(
    JFilter.transform({ body: { 'ogit/_id': 'test' }, type: 'UPDATE' }),
  ).toEqual({
    element: { 'ogit/_id': 'test' },
    action: 'UPDATE',
  });
});

test('JFilter test function', () => {
  expect(
    JFilter.equals('element.ogit/_id', 'test').test({
      element: { 'ogit/_id': 'test' },
      action: 'UPDATE',
    }),
  ).toEqual(true);

  expect(
    JFilter.equals('action', 'UPDATE').test({
      element: { 'ogit/_id': 'test' },
      action: 'CREATE',
    }),
  ).toEqual(false);

  expect(
    JFilter.equals('action', '*').test({
      element: { 'ogit/_id': 'test' },
      action: 'CREATE',
    }),
  ).toEqual(true);

  expect(
    JFilter.and(
      JFilter.equals('element.ogit/_id', 'test'),
      JFilter.equals('action', 'CREATE'),
    ).test({
      element: { 'ogit/_id': 'test' },
      action: 'CREATE',
    }),
  ).toEqual(true);

  expect(
    JFilter.and(
      JFilter.equals('element.ogit/_id', 'test'),
      JFilter.equals('action', 'CREATE'),
    ).test({
      element: { 'ogit/_id': 'test2' },
      action: 'CREATE',
    }),
  ).toEqual(false);
});
