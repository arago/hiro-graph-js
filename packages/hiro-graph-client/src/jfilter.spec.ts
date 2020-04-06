import { JFilter } from './jfilter';

test('JFilter snapshots', () => {
  const tests = [
    new JFilter().and('a = b', 'd = e'),
    new JFilter().or('a = b', 'd = e'),
    new JFilter().and('a = b', new JFilter('d = e')),
    new JFilter().and('a = b', new JFilter().or('e = f').and('d = c', 'g = f')),
  ];

  tests.map((t) => expect(t.toString()).toMatchSnapshot());
});

test('JFilter functions', () => {
  expect(new JFilter().and('a', 'b').toString()).toBe('&(a)(b)');
  expect(new JFilter().or('a', 'b').toString()).toBe('|(a)(b)');
});

test('JFilter nested', () => {
  expect(new JFilter().and('a', new JFilter().and('b', 'c')).toString()).toBe(
    '&(a)(&(b)(c))',
  );
  expect(new JFilter().or('a', new JFilter().or('b', 'c')).toString()).toBe(
    '|(a)(|(b)(c))',
  );
});
