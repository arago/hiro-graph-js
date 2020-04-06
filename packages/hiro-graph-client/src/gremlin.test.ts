/* eslint-env jest */
/**
 *  Testing the Gremlin Query Builder
 */
import { gremlin as queryBuilder, GremlinQueryBuilder, T } from './gremlin';

interface GremlinTest {
  name: string;
  build: (g: GremlinQueryBuilder) => GremlinQueryBuilder;
  output?: string;
  throws?: boolean;
  method?: any;
}

describe('Gremlin Query Builder', function () {
  const argFormatTests: GremlinTest[] = [
    {
      name: 'obj capable method single prop, single value',
      build: (g: GremlinQueryBuilder) => g.has('foo', 'bar'),
      output: `has("foo","bar")`,
    },
    {
      name: 'obj capable method, obj arg',
      build: (g: GremlinQueryBuilder) =>
        g.has({
          foo: 'bar',
          baz: 'quux',
        }),
      output: `has("foo","bar").has("baz","quux")`,
    },
    {
      name: 'regular method, simple value',
      build: (g: GremlinQueryBuilder) => g.in('arg'),
      output: `in("arg")`,
    },
    {
      name: 'regular method `T.<comparator>` via export',
      build: (g: GremlinQueryBuilder) => g.in(T.neq),
      output: `in(T.neq)`,
    },
    {
      name: 'regular method `T.<comparator>` arg',
      build: (g: GremlinQueryBuilder) => g.in('T.in'),
      output: `in(T.in)`,
    },
    {
      name: 'regular method number value',
      build: (g: GremlinQueryBuilder) => g.in(25),
      output: `in(25)`,
    },
    {
      name: 'regular method java long arg',
      build: (g: GremlinQueryBuilder) => g.in('1.23l'),
      output: `in(1.23l)`,
    },
    {
      name: 'regular method java float arg',
      build: (g: GremlinQueryBuilder) => g.in('1.23f'),
      output: `in(1.23f)`,
    },
    {
      name: 'regular method boolean arg',
      build: (g: GremlinQueryBuilder) => g.in(false),
      output: `in(false)`,
    },
    {
      name: 'regular method, array value',
      build: (g: GremlinQueryBuilder) => g.in(['foo', T.notin, '0.1f', true]),
      output: `in("foo",T.notin,0.1f,true)`,
    },
    {
      name: 'regular method quotes needed',
      build: (g: GremlinQueryBuilder) =>
        g.in(`this has doublequote " and dollar $ symbols`),
      output: `in("this has doublequote \\" and dollar \\$ symbols")`,
    },
  ];

  const simpleMethodTests: GremlinTest[] = ([
    //these all should have the simple method interface.
    'inE',
    'outE',
    'bothE',
    'inV',
    'outV',
    'bothV',
    'in',
    'out',
    'both',
    'values',
    'property',
    'getProperty',
    'count',
    'as',
    'back',
    'shuffle',
  ] as Array<keyof GremlinQueryBuilder>).map((method) => ({
    name: `should have simple method: ${method}`,
    build: (g: GremlinQueryBuilder) => (g[method] as any)('test'),
    output: `${method}("test")`,
    method: method,
  }));

  const objectMethodTests: GremlinTest[] = (['has', 'hasNot'] as Array<
    keyof GremlinQueryBuilder
  >).map((method) => ({
    name: `should have object capable method: ${method}`,
    build: (g: GremlinQueryBuilder) =>
      (g[method] as any)({ foo: 'bar', baz: 'quux' }),
    output: `${method}("foo","bar").${method}("baz","quux")`,
    method: method,
  }));

  const complexMethodTests: GremlinTest[] = [
    {
      name: 'transform (object)',
      build: (g: GremlinQueryBuilder) =>
        g.transform({
          a: (_: GremlinQueryBuilder) => _,
          b: (_: GremlinQueryBuilder) => _.has('foo', 'bar'),
        }),
      output: `transform{[a:it,b:it.has("foo","bar")]}`,
      method: 'transform',
    },
    {
      name: 'transform (array)',
      build: (g: GremlinQueryBuilder) =>
        g.transform([(_) => _, (_) => _.has('foo', 'bar')]),
      output: `transform{[it,it.has("foo","bar")]}`,
      method: 'transform',
    },
    {
      name: 'copySplit (default merge)',
      build: (g: GremlinQueryBuilder) =>
        g.copySplit([(_) => _, (_) => _.has('foo', 'bar')]),
      output: `copySplit(_(),_().has("foo","bar")).fairMerge`,
      method: 'copySplit',
    },
    {
      name: 'copySplit (explicit merge)',
      build: (g: GremlinQueryBuilder) =>
        g.copySplit([(_) => _, (_) => _.has('foo', 'bar')], 'exhaustMerge'),
      output: `copySplit(_(),_().has("foo","bar")).exhaustMerge`,
      method: 'copySplit',
    },
    {
      name: 'copySplit (invalid merge)',
      build: (g: GremlinQueryBuilder) =>
        g.copySplit([(_) => _, (_) => _.has('foo', 'bar')], 'fooMerge'),
      throws: true,
      method: 'copySplit',
    },
    {
      name: 'or',
      build: (g: GremlinQueryBuilder) =>
        g.or([(_) => _, (_) => _.has('foo', 'bar')]),
      output: `or(__,__.has("foo","bar"))`,
      method: 'or',
    },
    {
      name: 'by',
      build: (g: GremlinQueryBuilder) => g.by('ogit/name'),
      output: 'by("ogit/name")',
      method: 'by',
    },
    {
      name: 'range',
      build: (g: GremlinQueryBuilder) => g.range(0, 10),
      output: 'range(0, 10)',
      method: 'range',
    },
    {
      name: 'dedup (default)',
      build: (g: GremlinQueryBuilder) => g.dedup(),
      output: `dedup{it.getProperty("ogit/_id")}`,
      method: 'dedup',
    },
    {
      name: 'dedup (explicit prop)',
      build: (g: GremlinQueryBuilder) => g.dedup('foo'),
      output: `dedup{it.getProperty("foo")}`,
      method: 'dedup',
    },
    {
      name: 'limit',
      build: (g: GremlinQueryBuilder) => g.limit(0, 1),
      output: `[0..1]`,
      method: 'limit',
    },
    {
      name: 'order',
      build: (g: GremlinQueryBuilder) => g.order(),
      output: `order()`,
      method: 'order',
    },
    {
      name: 'filter',
      //this has no validation...
      build: (g: GremlinQueryBuilder) => g.filter(`it.age > 29`),
      output: `filter{it.age > 29}`,
      method: 'filter',
    },
    {
      name: 'addTempProp (invalid temp prop)',
      build: (g: GremlinQueryBuilder) => g.addTempProp('foo', 'bar'),
      throws: true,
      method: 'addTempProp',
    },
    {
      name: 'addTempProp (valid temp prop)',
      build: (g: GremlinQueryBuilder) => g.addTempProp('$_foo', 'bar'),
      output: `transform{it.$_foo="bar";it}`,
      method: 'addTempProp',
    },
    {
      name: 'addComputedProp (invalid temp prop)',
      build: (g: GremlinQueryBuilder) =>
        g.addComputedProp('foo', (_) => _.getProperty('bar')),
      throws: true,
      method: 'addComputedProp',
    },
    {
      name: 'addComputedProp (valid temp prop, querybuilder)',
      build: (g: GremlinQueryBuilder) =>
        g.addComputedProp('$_foo', (_) => _.getProperty('bar')),
      output: `transform{it.$_foo=it.getProperty("bar");it}`,
      method: 'addComputedProp',
    },
    {
      name: 'addComputedProp (valid temp prop, query string)',
      build: (g: GremlinQueryBuilder) => g.addComputedProp('$_foo', 'bar + 1'),
      output: `transform{it.$_foo=it.bar + 1;it}`,
      method: 'addComputedProp',
    },
    {
      name: 'groupBy (no result prop, group prop is `label` for edges)',
      build: (g: GremlinQueryBuilder) => g.groupBy('label'),
      output: `groupBy{it.label}{it}.cap`,
      method: 'groupBy',
    },
    {
      name: 'groupBy (no result prop)',
      build: (g: GremlinQueryBuilder) => g.groupBy('foo'),
      output: `groupBy{it.getProperty("foo")}{it}.cap`,
      method: 'groupBy',
    },
    {
      name: 'groupBy (with result prop)',
      build: (g: GremlinQueryBuilder) => g.groupBy('foo', 'bar'),
      output: `groupBy{it.getProperty("foo")}{it.getProperty("bar")}.cap`,
      method: 'groupBy',
    },
    {
      name: 'groupCount (label - for edges)',
      build: (g: GremlinQueryBuilder) => g.groupCount('label'),
      output: `groupCount{it.label}.cap`,
      method: 'groupCount',
    },
    {
      name: 'groupCount (regular prop)',
      build: (g: GremlinQueryBuilder) => g.groupCount('$_foo'),
      output: `groupCount{it.getProperty("\\$_foo")}.cap`,
      method: 'groupCount',
    },
    {
      name: 'tree',
      build: (g: GremlinQueryBuilder) => g.tree(),
      output: `tree.cap`,
      method: 'tree',
    },
  ];

  const tests = [
    ...argFormatTests,
    ...simpleMethodTests,
    ...objectMethodTests,
    ...complexMethodTests,
  ];

  const testedMethods = new Set();

  tests.forEach(({ method }: any) => testedMethods.add(method));

  //now run them
  tests.forEach(({ name, build, output, throws = false }: GremlinTest) => {
    it(name, function () {
      const gremlin = queryBuilder();

      if (throws) {
        expect(() => build(gremlin)).toThrow(Error);
      } else {
        build(gremlin);

        const actual = '' + gremlin;

        expect(actual).toBe(output);
      }
    });
  });

  // now make sure we covered all the methods...
  it('should test all queryBuilder() methods', () => {
    const g = GremlinQueryBuilder.prototype;
    const untestedMethods = Object.getOwnPropertyNames(g)
      .filter((m) => {
        switch (m) {
          // these methods are internal
          case 'constructor':
          case 'toString':
          case 'raw':
          case 'append':
            return false;
          default:
            // @ts-ignore
            return typeof g[m] === 'function';
        }
      })
      .filter((m) => !testedMethods.has(m));

    // this expectation gives us the best output in case of failure
    expect(untestedMethods).toEqual([]);
  });
});
