/* eslint-env jest */
/**
 *  Testing the codecs, and that number coercion is correctly lexically sortable.
 */
import createCodec from "../src/codecs";

//rescursive object for JSON test.
const recurser = {};
recurser.recurser = recurser;

//for the timestamp tests.

const isoDate = "2016-05-26T12:50:37.577Z";
const date = Date.parse(isoDate);
const tooEarly = Date.parse("Sun, 09 Sep 2001 01:46:38 GMT");
const tooLate = Date.parse("Sat, 20 Nov 2286 17:46:41 GMT");

const isoWithTimeZone = "2016-05-26T13:50:37.577+0100";
const isoWithTimeZone2 = "2016-05-26T11:50:37.577-0100";
const isoWithTimeZone3 = "2016-05-26T13:50:37.577+01:00";

describe("Codecs:", function() {
    const testPlan = {
        string: {
            commutative: [
                {
                    name: "simple string",
                    input: "some string",
                    output: "some string"
                }
            ],
            encoding: [
                {
                    name: "string cast",
                    input: { some: "object" },
                    output: "[object Object]"
                }
            ]
        },
        identity: {
            commutative: [
                {
                    name: "integer",
                    input: 1,
                    output: 1
                },
                {
                    name: "undefined",
                    input: undefined,
                    output: undefined
                },
                {
                    name: "object",
                    input: { foo: "bar" },
                    output: { foo: "bar" }
                },
                {
                    name: "array",
                    input: [1, "two"],
                    output: [1, "two"]
                },
                {
                    name: "null",
                    input: null,
                    output: null
                },
                {
                    name: "bool",
                    input: true,
                    output: true
                }
            ]
        },
        int: {
            commutative: [
                {
                    name: "positive int",
                    input: 101,
                    output: "p0000000000000101"
                },
                {
                    name: "negative int",
                    input: -101,
                    output: "n9007199254740890"
                }
            ],
            encoding: [
                {
                    name: "string that doesn't look like a number",
                    input: "this is not a number",
                    output: "p0000000000000000"
                },
                {
                    name: "NaN",
                    input: NaN,
                    output: "p0000000000000000"
                },
                {
                    name: "positive float",
                    input: 123.456,
                    output: "p0000000000000123"
                }
            ],
            decoding: [
                {
                    name: "something that doesn't look like a number",
                    input: "this is not a number",
                    output: 0
                }
            ],
            ordering: [
                {
                    name: "simple",
                    sorted: [1, 2, 10, 20, 100, 200],
                    shuffled: [200, 1, 2, 10, 100, 20]
                },
                {
                    name: "with negatives",
                    sorted: [-10000000, -100, 0, 1, 2, 10, 20, 200, 4000],
                    shuffled: [1, 0, -10000000, 10, -100, 2, 4000, 20, 200]
                }
            ]
        },
        uint: {
            commutative: [
                {
                    name: "positive int",
                    input: 101,
                    output: "0000000000000101"
                }
            ],
            encoding: [
                {
                    name: "negative int",
                    input: -101,
                    output: "0000000000000101"
                },
                {
                    name: "string that doesn't look like a number",
                    input: "this is not a number",
                    output: "0000000000000000"
                },
                {
                    name: "NaN",
                    input: NaN,
                    output: "0000000000000000"
                }
            ],
            decoding: [
                {
                    name: "something that doesn't look like a number",
                    input: "this is not a number",
                    output: 0
                },
                {
                    name: "something that looks like `int` encoding",
                    input: "p0000000000000123",
                    output: 123
                },
                {
                    name:
                        "something that looks like -ve `int` encoding (we should lose sign)",
                    input: "n9007199254740890",
                    output: 101
                }
            ],
            ordering: [
                {
                    name: "simple",
                    sorted: [1, 2, 10, 20, 100, 200],
                    shuffled: [200, 1, 2, 10, 100, 20]
                }
            ]
        },
        bool: {
            commutative: [
                {
                    name: "true",
                    input: true,
                    output: "true"
                },
                {
                    name: "false",
                    input: false,
                    output: "false"
                }
            ],
            encoding: [
                {
                    name: "truthy string",
                    input: "this string is not empty",
                    output: "true"
                },
                {
                    name: "falsey number",
                    input: 0,
                    output: "false"
                },
                {
                    name: "string 'false' (it's truthy!)",
                    input: "false",
                    output: "true"
                }
            ],
            decoding: [
                {
                    name: "random string",
                    input: "something random",
                    output: false
                }
            ]
        },
        "bool:yes:no": {
            commutative: [
                {
                    name: "true",
                    input: true,
                    output: "yes"
                },
                {
                    name: "false",
                    input: false,
                    output: "no"
                }
            ],
            encoding: [
                {
                    name: "truthy string",
                    input: "this string is not empty",
                    output: "yes"
                },
                {
                    name: "falsey number",
                    input: 0,
                    output: "no"
                },
                {
                    name: "string 'false' (it's truthy!)",
                    input: "false",
                    output: "yes"
                }
            ],
            decoding: [
                {
                    name: "random string",
                    input: "something random",
                    output: false
                }
            ]
        },
        "bool:ok": {
            commutative: [
                {
                    name: "true",
                    input: true,
                    output: "ok"
                },
                {
                    name: "false",
                    input: false,
                    output: null
                }
            ],
            encoding: [
                {
                    name: "truthy string",
                    input: "this string is not empty",
                    output: "ok"
                },
                {
                    name: "falsey number",
                    input: 0,
                    output: null
                },
                {
                    name: "string 'false' (it's truthy!)",
                    input: "false",
                    output: "ok"
                }
            ],
            decoding: [
                {
                    name: "random string",
                    input: "something random",
                    output: false
                }
            ]
        },
        json: {
            commutative: [
                {
                    name: "primitive string",
                    input: "string",
                    output: `"string"`
                },
                {
                    name: "primitive number",
                    input: 10101,
                    output: `10101`
                },
                {
                    name: "array",
                    input: [1, 2, 3, "four"],
                    output: `[1,2,3,"four"]`
                },
                {
                    name: "object",
                    input: { foo: "bar", baz: [1, 2, 3], quux: { qu: "ux" } },
                    output: `{"foo":"bar","baz":[1,2,3],"quux":{"qu":"ux"}}`
                }
            ],
            encoding: [
                {
                    name: "recursive object",
                    input: recurser,
                    output: null
                }
            ],
            decoding: [
                {
                    name: "invalid JSON",
                    input: "this is not JSON",
                    output: "this is not JSON"
                }
            ]
        },
        list: {
            commutative: [
                {
                    name: "single item",
                    input: ["test"],
                    output: "test"
                },
                {
                    name: "multi item",
                    input: ["one", "two", "three"],
                    output: "one, two, three"
                }
            ],
            encoding: [
                {
                    name: "string input, single item",
                    input: "test",
                    output: "test"
                },
                {
                    name: "string input, multi item (formatting)",
                    input: "one, two,three",
                    output: "one, two, three"
                },
                {
                    name: "array input, entries cast",
                    input: ["one", 2, { three: 3 }],
                    output: "one, 2, [object Object]"
                },
                {
                    name: "sparse list",
                    input: ["one", , , "two"], //eslint-disable-line no-sparse-arrays
                    output: "one, two"
                }
            ],
            decoding: [
                {
                    name: "sparse list",
                    input: "one,,two",
                    output: ["one", "two"]
                }
            ]
        },
        timestamp: {
            commutative: [
                {
                    name: "a valid timestamp",
                    input: date,
                    output: "" + date
                }
            ],
            encoding: [
                {
                    name: "too early timestamp",
                    input: tooEarly,
                    output: null
                },
                {
                    name: "too late timestamp",
                    input: tooLate,
                    output: null
                },
                {
                    name: "a date object",
                    input: new Date(date),
                    output: "" + date
                }
            ],
            decoding: [
                {
                    name: "too early timestamp",
                    input: tooEarly,
                    output: null
                },
                {
                    name: "too late timestamp",
                    input: tooLate,
                    output: null
                },
                {
                    name: "not a valid timestamp at all",
                    input: "this is not a timestamp",
                    output: null
                },
                {
                    name: "iso8061 formatting",
                    input: isoDate,
                    output: date
                }
            ]
        },
        iso8601: {
            commutative: [
                {
                    name: "basic UTC",
                    input: date,
                    output: isoDate
                }
            ],
            encoding: [
                {
                    name: "not a timestamp at all",
                    input: undefined,
                    output: null
                }
            ],
            decoding: [
                {
                    name: "with timezone +0100",
                    input: isoWithTimeZone,
                    output: date
                },
                {
                    name: "with timezone -0100",
                    input: isoWithTimeZone2,
                    output: date
                },
                {
                    name: "with timezone +01:00",
                    input: isoWithTimeZone3,
                    output: date
                }
            ]
        }
    };

    const testLexicalOrdering = (type, codec) => ({
        name,
        sorted,
        shuffled
    }) => {
        it(`'${type}' ensure lexical sort: ${name}`, function() {
            //encode then sort should = sort then encode
            //this is the lexical sort.

            //Using randomisation in tests? red flag? I think this is OK because we have
            //fixed shuffle too.
            const randomised = shuffle(sorted.slice());
            const afterShuffled = shuffled
                .map(codec.encode)
                .sort()
                .map(codec.decode);
            const afterRandomised = randomised
                .map(codec.encode)
                .sort()
                .map(codec.decode);
            expect(afterShuffled).toEqual(sorted);
            expect(afterRandomised).toEqual(sorted);
        });
    };

    const testExplicit = (type, codec, method) => ({ name, input, output }) => {
        it(`'${type}' ${method}: ${name}`, function() {
            const actual = codec[method](input);
            expect(actual).toEqual(output);
        });
    };

    const testCommutative = (type, codec) => ({ name, input, output }) => {
        it(`'${type}': ${name}`, function() {
            const encoded = codec.encode(input);
            const decoded = codec.decode(output);
            const encodeDecode = codec.decode(encoded);
            const decodeEncode = codec.encode(decoded);
            //console.log({ encoded, encodeDecode, decoded, decodeEncode })
            expect(encoded).toEqual(output);
            expect(decodeEncode).toEqual(output);
            expect(decoded).toEqual(input);
            expect(encodeDecode).toEqual(input);
        });
    };

    Object.keys(testPlan).forEach(type => {
        const {
            encoding = [],
            decoding = [],
            commutative = [],
            ordering = []
        } = testPlan[type];
        const codec = createCodec(type);
        commutative.forEach(testCommutative(type, codec));
        encoding.forEach(testExplicit(type, codec, "encode"));
        decoding.forEach(testExplicit(type, codec, "decode"));
        ordering.forEach(testLexicalOrdering(type, codec));
    });
});

//for the shuffling of array in the ordering test, we use stack-shuffle ;)
// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length;
    let randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex]
        ];
    }
    return array;
}
