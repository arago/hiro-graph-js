/**
 *  Testing the Gremlin Query Builder
 */
import { queryBuilder } from "../src/gremlin";
import { expect } from "chai";

describe("Gremlin Query Builder", function() {
    const argFormatTests = [
        {
            name: "obj capable method single prop, single value",
            build: g => g.has("foo", "bar"),
            output: `has("foo","bar")`
        },
        {
            name: "obj capable method, obj arg",
            build: g =>
                g.has({
                    foo: "bar",
                    baz: "quux"
                }),
            output: `has("foo","bar").has("baz","quux")`
        },
        {
            name: "regular method, simple value",
            build: g => g.in("arg"),
            output: `in("arg")`
        },
        {
            name: "regular method `T.<comparator>` arg",
            build: g => g.in("T.in"),
            output: `in(T.in)`
        },
        {
            name: "regular method java long arg",
            build: g => g.in("1.23l"),
            output: `in(1.23l)`
        },
        {
            name: "regular method java float arg",
            build: g => g.in("1.23f"),
            output: `in(1.23f)`
        },
        {
            name: "regular method boolean arg",
            build: g => g.in(false),
            output: `in(false)`
        },
        {
            name: "regular method, array value",
            build: g => g.in(["foo", "T.notin", "0.1f", true]),
            output: `in(["foo",T.notin,0.1f,true])`
        },
        {
            name: "regular method quotes needed",
            build: g => g.in(`this has doublequote " and dollar $ symbols`),
            output: `in("this has doublequote \\" and dollar \\$ symbols")`
        }
    ];

    const simpleMethodTests = [
        //these all should have the simple method interface.
        "inE",
        "outE",
        "bothE",
        "inV",
        "outV",
        "bothV",
        "in",
        "out",
        "both",
        "getProperty",
        "count",
        "as",
        "back",
        "shuffle"
    ].map(method => ({
        name: `should have simple method: ${method}`,
        build: g => g[method]("test"),
        output: `${method}("test")`
    }));

    const objectMethodTests = ["has", "hasNot"].map(method => ({
        name: `should have object capable method: ${method}`,
        build: g => g[method]({ foo: "bar", baz: "quux" }),
        output: `${method}("foo","bar").${method}("baz","quux")`
    }));

    const complexMethodTests = [
        {
            name: "transform (object)",
            build: g =>
                g.transform({
                    a: _ => _,
                    b: _ => _.has("foo", "bar")
                }),
            output: `transform{[a:it,b:it.has("foo","bar")]}`
        },
        {
            name: "transform (array)",
            build: g => g.transform([_ => _, _ => _.has("foo", "bar")]),
            output: `transform{[it,it.has("foo","bar")]}`
        },
        {
            name: "copySplit (default merge)",
            build: g => g.copySplit([_ => _, _ => _.has("foo", "bar")]),
            output: `copySplit(_(),_().has("foo","bar")).fairMerge`
        },
        {
            name: "copySplit (explicit merge)",
            build: g =>
                g.copySplit([_ => _, _ => _.has("foo", "bar")], "exhaustMerge"),
            output: `copySplit(_(),_().has("foo","bar")).exhaustMerge`
        },
        {
            name: "copySplit (invalid merge)",
            build: g =>
                g.copySplit([_ => _, _ => _.has("foo", "bar")], "fooMerge"),
            throws: true
        },
        {
            name: "or",
            build: g => g.or([_ => _, _ => _.has("foo", "bar")]),
            output: `or(_(),_().has("foo","bar"))`
        },
        {
            name: "dedup (default)",
            build: g => g.dedup(),
            output: `dedup{it.getProperty("ogit/_id")}`
        },
        {
            name: "dedup (explicit prop)",
            build: g => g.dedup("foo"),
            output: `dedup{it.getProperty("foo")}`
        },
        {
            name: "limit",
            build: g => g.limit(0, 1),
            output: `hasNot("ogit/_is-deleted",true)[0..1]`
        },
        {
            name: "order (default dir - desc)",
            build: g => g.order("foo"),
            output: `order{it.b.getProperty("foo") <=> it.a.getProperty("foo")}`
        },
        {
            name: "order (explicit dir - asc)",
            build: g => g.order("foo", "asc"),
            output: `order{it.a.getProperty("foo") <=> it.b.getProperty("foo")}`
        },
        {
            name: "filter",
            //this has no validation...
            build: g => g.filter(`it.age > 29`),
            output: `filter{it.age > 29}`
        },
        {
            name: "addTempProp (invalid temp prop)",
            build: g => g.addTempProp("foo", "bar"),
            throws: true
        },
        {
            name: "addTempProp (valid temp prop)",
            build: g => g.addTempProp("$_foo", "bar"),
            output: `transform{it.$_foo="bar";it}`
        },
        {
            name: "addComputedProp (invalid temp prop)",
            build: g => g.addComputedProp("foo", _ => _.getProperty("bar")),
            throws: true
        },
        {
            name: "addComputedProp (valid temp prop, querybuilder)",
            build: g => g.addComputedProp("$_foo", _ => _.getProperty("bar")),
            output: `transform{it.$_foo=it.getProperty("bar");it}`
        },
        {
            name: "addComputedProp (valid temp prop, query string)",
            build: g => g.addComputedProp("$_foo", "bar + 1"),
            output: `transform{it.$_foo=it.bar + 1;it}`
        },
        {
            name: "groupBy (no result prop, group prop is `label` for edges)",
            build: g => g.groupBy("label"),
            output: `groupBy{it.label}{it}.cap`
        },
        {
            name: "groupBy (no result prop)",
            build: g => g.groupBy("foo"),
            output: `groupBy{it.getProperty("foo")}{it}.cap`
        },
        {
            name: "groupBy (with result prop)",
            build: g => g.groupBy("foo", "bar"),
            output: `groupBy{it.getProperty("foo")}{it.getProperty("bar")}.cap`
        },
        {
            name: "groupCount (label - for edges)",
            build: g => g.groupCount("label"),
            output: `groupCount{it.label}.cap`
        },
        {
            name: "groupCount (regular prop)",
            build: g => g.groupCount("$_foo"),
            output: `groupCount{it.getProperty("\\$_foo")}.cap`
        }
    ];

    const tests = [].concat(
        argFormatTests,
        simpleMethodTests,
        objectMethodTests,
        complexMethodTests
    );

    //now run them
    tests.forEach(({ name, build, output, throws = false }) => {
        it(name, function() {
            const gremlin = queryBuilder();
            if (throws) {
                expect(() => build(gremlin)).to.throw(Error);
            } else {
                build(gremlin);
                const actual = "" + gremlin;
                expect(actual).to.equal(output);
            }
        });
    });
});
