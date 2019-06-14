/* eslint-env jest */
/**
 *  Testing the Lucene Query Generator
 */
import schema from "../__mocks__/schema.js";
import parse, { getPlaceholderKeyForIndex } from "@hiro-graph/lucene";

describe("Lucene Query Generator:", function() {
    const simple = schema.get("Simple");
    const internal = schema.get(null);
    const allType = schema.get("AllTypes");
    const extreme = schema.get("ForExtremeQueryTest");

    const tests = [
        {
            name: "simple id query (no entity type)",
            input: [{ _id: "xyz" }, internal],
            output: `+ogit\\/_id:"xyz"`
        },
        {
            name: "simple id query",
            input: [{ _id: "xyz" }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/_id:"xyz"`
        },
        {
            name: "no entity, but _type query",
            input: [{ $or: { _type: ["Simple", "Minimal"] } }, internal],
            output: `+(ogit\\/_type:"ogit/Simple" ogit\\/_type:"ogit/Minimal")`
        },
        {
            name: "should convert key/values to persistence forms",
            input: [{ prop: "test" }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/requiredProp:"test"`
        },
        {
            name: "multiple fields",
            input: [{ prop: "string", anotherProp: "second" }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/requiredProp:"string" +ogit\\/someOtherProp:"second"`
        },
        {
            name: "multiple values (as and)",
            input: [{ prop: ["string", "value"] }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(prop:"string" prop:"value")`
        },
        {
            name: "$not",
            input: [{ $not: { prop: "test" } }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(-ogit\\/requiredProp:"test")`
        },
        {
            name: "$not (multi value)",
            input: [{ $not: { prop: ["test", "not"] } }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(-ogit\\/requiredProp:"test" -ogit\\/requiredProp:"not")`
        },
        {
            name: "$or (single value, trick question!)",
            input: [{ $or: { prop: "test" } }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(+ogit\\/requiredProp:"test")`
        },
        {
            name: "$or (multiple. same key)",
            input: [{ $or: { prop: ["test", "value"] } }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(ogit\\/requiredProp:"test" ogit\\/requiredProp:"value")`
        },
        {
            name: "$or (multiple. diff key)",
            input: [{ $or: { prop: "test", anotherProp: "this too" } }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +(ogit\\/requiredProp:"test" ogit\\/someOtherProp:"this too")`
        },
        {
            name: "$missing (single)",
            input: [{ $missing: "prop" }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +_missing_:"ogit/requiredProp"`
        },
        {
            name: "$missing (multiple)",
            input: [{ $missing: ["prop", "anotherProp"] }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +_missing_:"ogit/requiredProp" +_missing_:"ogit/someOtherProp"`
        },
        {
            name: "$range",
            input: [{ $range: { uint: [1, 5] } }, allType],
            output: `+ogit\\/_type:"ogit/TypeTest" +\\/uint:["0000000000000001" TO "0000000000000005"]`
        },
        {
            name: "$search",
            input: [{ $search: `test "quoted term"` }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/_content.ngram:$ph_0`,
            placeholders: ["test quoted term"]
        },
        {
            name: "extreme example",
            input: [
                {
                    key1: "value",
                    key2: ["multi", "value"],
                    $not: {
                        key4: "not",
                        key5: ["not", "multi"],
                        $range: {
                            key6: ["notFrom", "notTo"],
                            key7: ["second", "range"]
                        },
                        $or: { key8: ["not", "or", "values"] }
                    },
                    $or: {
                        key9: "or this",
                        key10: ["two", "terms"],
                        $not: {
                            key11: "nor this"
                        },
                        $missing: "key12",
                        $search: { type: "ngram", term: "or search" }
                    },
                    $missing: ["key13", "key14"],
                    $search: { type: "ngram", term: 'test "quoted term"' }
                },
                extreme
            ],
            output: [
                `+ogit\\/_type:"ogit/Extreme" +\\/key1:"value" +(key2:"multi" key2:"value")`,
                `+(-\\/key4:"not" -\\/key5:"not" -\\/key5:"multi" -\\/key6:["notFrom" TO "notTo"]`,
                `-\\/key7:["second" TO "range"] -(\\/key8:"not" \\/key8:"or" \\/key8:"values"))`,
                `+(\\/key9:"or this" \\/key10:"two" \\/key10:"terms" (-\\/key11:"nor this") _missing_:"/key12"`,
                `ogit\\/_content.ngram:$ph_0) +_missing_:"/key13" +_missing_:"/key14"`,
                `+ogit\\/_content.ngram:$ph_1`
            ].join(" "),
            placeholders: ["or search", "test quoted term"]
        },
        {
            name: "strings with quotes",
            input: [{ prop: 'test " quoted' }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/requiredProp:"test \\" quoted"`
        },
        {
            name: "strings with existing slashes",
            input: [{ prop: "test \\ slashed" }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/requiredProp:"test \\\\ slashed"`
        },
        {
            name: "strings with exsiting slashed quotes",
            input: [{ prop: 'test \\" slashquoted' }, simple],
            output: `+ogit\\/_type:"ogit/Simple" +ogit\\/requiredProp:"test \\\\\\" slashquoted"`
        }
    ];

    tests.forEach(({ name, input, output, placeholders = [] }) => {
        it(name, function() {
            const actual = parse(...input);
            expect(actual.querystring).toBe(output);
            placeholders.forEach((p, i) => {
                expect(
                    actual.placeholders[getPlaceholderKeyForIndex(i)]
                ).toEqual(p);
            });
        });
    });
});
