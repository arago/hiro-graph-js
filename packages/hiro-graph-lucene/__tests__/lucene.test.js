/**
 *  Testing the Lucene Query Generator
 */
import parse from "hiro-graph-lucene";

describe("Lucene Query Generator:", function() {
    const tests = [
        {
            name: "single field",
            input: { "ogit/_id": "xyz" },
            output: `+ogit\\/_id:"xyz"`
        },
        {
            name: "multiple field"
        },
        {
            name: "multiple as and"
        },
        {
            name: "$not"
        },
        {
            name: "$not (multi value)"
        },
        {
            name: "$or (single value, trick question!)"
        },
        {
            name: "$or (multiple. same key)"
        },
        {
            name: "$or (multiple. diff key)"
        },
        {
            name: "$missing (single)"
        },
        {
            name: "$missing (multiple)"
        },
        {
            name: "$range"
        },
        {
            name: "$search"
        },
        {
            name: "extreme example"
        },
        {
            name: "strings with quotes"
        },
        {
            name: "strings with existing slashes"
        },
        {
            name: "strings with exsiting slashed quotes"
        }
    ];

    tests.forEach(({ name, input, output, placeholders = false }) => {
        it.skip(name, function() {
            const actual = parse(input);
            expect(actual.querystring).toBe(output);
            if (placeholders) {
                expect(actual.placeholders).toEqual(placeholders);
            }
        });
    });
});
