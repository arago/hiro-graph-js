import { GraphEventType } from '../src';
import { Filter, parseFilter } from '../src/filter';

test('LDAPFilter snapshots', () => {
  const tests = [
    Filter.AND([
      Filter.attribute('a').equalTo('b'),
      Filter.attribute('d').equalTo('e'),
    ]),
    Filter.OR([
      Filter.attribute('a').equalTo('b'),
      Filter.attribute('d').equalTo('e'),
    ]),
    Filter.AND([
      Filter.attribute('a').equalTo('b'),
      Filter.attribute('d').equalTo('e'),
    ]),
    Filter.AND([
      Filter.attribute('a').equalTo('b'),
      Filter.OR([Filter.attribute('e').equalTo('f')]),
      Filter.AND([
        Filter.attribute('d').equalTo('c'),
        Filter.attribute('g').equalTo('f'),
      ]),
    ]),
  ];

  tests.map((t) => expect(t.toString()).toMatchSnapshot());
});

test('LDAPFilter functions', () => {
  expect(Filter.attribute('a').equalTo('b').toString()).toBe('(a=b)');
  expect(
    Filter.AND([
      Filter.attribute('a').present(),
      Filter.attribute('b').present(),
    ]).toString(),
  ).toBe('(&(a)(b))');
  expect(
    Filter.OR([
      Filter.attribute('a').present(),
      Filter.attribute('b').present(),
    ]).toString(),
  ).toBe('(|(a)(b))');
});

test('LDAPFilter nested', () => {
  expect(
    Filter.AND([
      Filter.attribute('a').present(),
      Filter.AND([
        Filter.attribute('b').present(),
        Filter.attribute('c').present(),
      ]),
    ]).toString(),
  ).toBe('(&(a)(&(b)(c)))');
  expect(
    Filter.OR([
      Filter.attribute('a').present(),
      Filter.OR([
        Filter.attribute('b').present(),
        Filter.attribute('c').present(),
      ]),
    ]).toString(),
  ).toBe('(|(a)(|(b)(c)))');
});

test('LDAPFilter transform', () => {
  const filter = Filter.AND([
    Filter.attribute('element.ogit/_type').equalTo('ogit/Mobile/HealthInfo'),
    Filter.attribute('action').any(),
  ]);

  const res = {
    body: { 'ogit/_type': 'ogit/Mobile/HealthInfo' },
    type: 'UPDATE' as GraphEventType,
  };

  expect(filter.match(Filter.transformEvent(res))).toEqual(true);

  expect(
    Filter.transformEvent({ body: { 'ogit/_id': 'test' }, type: 'UPDATE' }),
  ).toEqual({
    element: { 'ogit/_id': 'test' },
    action: 'UPDATE',
  });
});

test('LDAPFilter test function', () => {
  expect(
    Filter.attribute('element.ogit/_id')
      .equalTo('test')
      .match({
        element: { 'ogit/_id': 'test' },
        action: 'UPDATE',
      }),
  ).toEqual(true);

  expect(
    Filter.attribute('action')
      .equalTo('UPDATE')
      .match({
        element: { 'ogit/_id': 'test' },
        action: 'CREATE',
      }),
  ).toEqual(false);

  expect(
    Filter.attribute('action')
      .any()
      .match({
        element: { 'ogit/_id': 'test' },
        action: 'CREATE',
      }),
  ).toEqual(true);

  expect(
    Filter.AND([
      Filter.attribute('element.ogit/_id').equalTo('test'),
      Filter.attribute('action').equalTo('CREATE'),
    ]).match({
      element: { 'ogit/_id': 'test' },
      action: 'CREATE',
    }),
  ).toEqual(true);

  expect(
    Filter.AND([
      Filter.attribute('element.ogit/_id').equalTo('test'),
      Filter.attribute('action').equalTo('CREATE'),
    ]).match({
      element: { 'ogit/_id': 'test2' },
      action: 'CREATE',
    }),
  ).toEqual(false);
});

test('LDAP Filter Parse Snapshot', () => {
  const tests = [
    `&(|(action = GET)(action = UPDATE)(action = CREATE)(action = DELETE))(vertex.ogit/_type = ogit/CustomApplicationData)(vertex./type = InstanceSettings)`,
    '(element.ogit/_type=ogit/Automation/AutomationIssue)',
  ];

  tests.map((t) => expect(parseFilter(t)).toMatchSnapshot());
});

test('LDAP Filter Parse', () => {
  expect(
    parseFilter('(element.ogit/_type=ogit/Automation/AutomationIssue)'),
  ).toEqual({
    type: 'filter',
    attrib: 'element.ogit/_type',
    comp: '=',
    value: 'ogit/Automation/AutomationIssue',
  });
});
