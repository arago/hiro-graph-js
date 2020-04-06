import { StreamFilter } from './streamfilter';

test('StreamFilter snapshots', () => {
  const tests = [
    new StreamFilter().and('a = b', 'd = e'),
    new StreamFilter().or('a = b', 'd = e'),
    new StreamFilter().and('a = b', new StreamFilter('d = e')),
    new StreamFilter().and(
      'a = b',
      new StreamFilter().or('e = f').and('d = c', 'g = f'),
    ),
  ];

  tests.map((t) => expect(t.toString()).toMatchSnapshot());
});

test('StreamFilter functions', () => {
  expect(new StreamFilter().and('a', 'b').toString()).toBe('&(a)(b)');
  expect(new StreamFilter().or('a', 'b').toString()).toBe('|(a)(b)');
});

test('StreamFilter nested', () => {
  expect(
    new StreamFilter().and('a', new StreamFilter().and('b', 'c')).toString(),
  ).toBe('&(a)(&(b)(c))');
  expect(
    new StreamFilter().or('a', new StreamFilter().or('b', 'c')).toString(),
  ).toBe('|(a)(|(b)(c))');
});
