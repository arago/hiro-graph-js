import schema from "../__mocks__/schema";
import createEntity, {
    $dangerouslyGetDefinition,
    $dangerouslyGetProps
} from "../src/schema/entity";

describe("Schema:", function() {
    const def = schema.get("Simple")[$dangerouslyGetDefinition]();

    it("should throw when trying to re-define a known entity", () => {
        expect(() => schema.define(def)).toThrow(Error);
    });

    it("should throw when trying to define a new entity backed by the same OGIT entity", () => {
        def.name = "SomethingNew";
        expect(() => schema.define(def)).toThrow(Error);
    });

    it("should throw when trying to define an entity that doesn't start with lowercase", () => {
        def.name = "lowercase";
        def.ogit = "ogit/somethingTotallyDifferent";
        expect(() => schema.define(def)).toThrow(Error);
    });

    it("should return the same object when got by app name or OGIT name", () => {
        const app = schema.get("Simple");
        const ogit = schema.get(app.ogit);

        expect(app === ogit).toBeTruthy();
    });
});

describe("Entities", function() {
    const entity = schema.get("AllTypes");
    const props = entity[$dangerouslyGetProps]();

    it("should be able to get all props by application name", () => {
        props.forEach(prop => {
            expect(entity.prop(prop.dst)).toEqual(prop);
        });
    });

    it("should be able to get all props by ontology name", () => {
        props.forEach(prop => {
            expect(entity.prop(prop.src)).toEqual(prop);
        });
    });

    const uniqueSnowflake = {};

    const codecTests = [
        { prop: "string", encoded: "string", decoded: "string" },
        { prop: "identity", encoded: "string", decoded: "string" },
        { prop: "uint", encoded: "0000000000000101", decoded: 101 },
        { prop: "int", encoded: "p0000000000000101", decoded: 101 },
        { prop: "bool", encoded: "true", decoded: true },
        {
            prop: "json",
            encoded: `{"foo":[1,"2",true]}`,
            decoded: { foo: [1, "2", true] }
        },
        {
            prop: "list",
            encoded: "a, b, c",
            decoded: ["a", "b", "c"]
        },
        {
            prop: "timestamp",
            encoded: "" +
                new Date(Date.parse("2016-05-26T12:50:37.577Z")).getTime(),
            decoded: Date.parse("2016-05-26T12:50:37.577Z")
        },
        {
            prop: "iso8601",
            encoded: "2016-05-26T12:50:37.577Z",
            decoded: Date.parse("2016-05-26T12:50:37.577Z")
        },
        { prop: "identity", encoded: uniqueSnowflake, decoded: uniqueSnowflake }
    ].map(test => {
        test.prop = entity.prop(test.prop);
        return test;
    });

    it("should correctly coerce on encode", () => {
        codecTests.forEach(({ prop, encoded, decoded }) => {
            expect(entity.encode({ [prop.dst]: decoded })).toHaveProperty(
                prop.src,
                encoded
            );
        });
    });

    it("should correctly coerce on decode", () => {
        codecTests.forEach(({ prop, encoded, decoded }) => {
            expect(entity.decode({ [prop.src]: encoded })).toHaveProperty(
                prop.dst,
                decoded
            );
        });
    });

    const relationParsingTests = [
        {
            name: "simple",
            input: "ogit/verbName -> ogit/OtherType",
            hops: [
                {
                    direction: "out",
                    verb: "ogit/verbName",
                    filter: null,
                    vertices: ["ogit/OtherType"]
                }
            ]
        },
        {
            name: "compound",
            input: "ogit/a <- ogit/A, ogit/b -> ogit/B",
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: null,
                    vertices: ["ogit/A"]
                },
                {
                    direction: "out",
                    verb: "ogit/b",
                    filter: null,
                    vertices: ["ogit/B"]
                }
            ]
        },
        {
            name: "compound as array",
            input: ["ogit/a <- ogit/A", "ogit/b -> ogit/B"],
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: null,
                    vertices: ["ogit/A"]
                },
                {
                    direction: "out",
                    verb: "ogit/b",
                    filter: null,
                    vertices: ["ogit/B"]
                }
            ]
        },
        {
            name: "compound as mixed array",
            input: [
                "ogit/a <- ogit/A",
                "ogit/b -> ogit/B, ogit/c <- ogit/C|ogit/D"
            ],
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: null,
                    vertices: ["ogit/A"]
                },
                {
                    direction: "out",
                    verb: "ogit/b",
                    filter: null,
                    vertices: ["ogit/B"]
                },
                {
                    direction: "in",
                    verb: "ogit/c",
                    filter: null,
                    vertices: ["ogit/C", "ogit/D"]
                }
            ]
        },
        {
            name: "multi-type",
            input: "ogit/a <- ogit/A|ogit/B",
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: null,
                    vertices: ["ogit/A", "ogit/B"]
                }
            ]
        },
        {
            name: "explicit definition with filter",
            input: {
                direction: "in",
                verb: "ogit/a",
                filter: { "/foo": "bar" },
                vertex: "ogit/A"
            },
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: { "/foo": "bar" },
                    vertices: ["ogit/A"]
                }
            ]
        },
        {
            name: "mixed string and explicit",
            input: [
                "ogit/a <- ogit/A, ogit/b -> ogit/B",
                {
                    direction: "in",
                    verb: "ogit/c",
                    filter: { "/foo": "bar" },
                    vertex: "ogit/C"
                },
                "ogit/d -> ogit/D|ogit/E",
                {
                    direction: "out",
                    verb: "ogit/c",
                    vertices: ["ogit/F", "ogit/G"]
                }
            ],
            hops: [
                {
                    direction: "in",
                    verb: "ogit/a",
                    filter: null,
                    vertices: ["ogit/A"]
                },
                {
                    direction: "out",
                    verb: "ogit/b",
                    filter: null,
                    vertices: ["ogit/B"]
                },
                {
                    direction: "in",
                    verb: "ogit/c",
                    filter: { "/foo": "bar" },
                    vertices: ["ogit/C"]
                },
                {
                    direction: "out",
                    verb: "ogit/d",
                    filter: null,
                    vertices: ["ogit/D", "ogit/E"]
                },
                {
                    direction: "out",
                    verb: "ogit/c",
                    filter: null,
                    vertices: ["ogit/F", "ogit/G"]
                }
            ]
        }
    ];

    const relationTestEntity = createEntity(
        {
            name: "RelationTest",
            ogit: "ogit/test",
            relations: relationParsingTests.reduce(
                (obj, test) => ((obj[test.name] = test.input), obj),
                {}
            )
        },
        schema
    );

    relationParsingTests.forEach(({ name, hops }) => {
        it("should parse the relations correctly: " + name, () => {
            const relation = relationTestEntity.relation(name);
            expect(relation.hops).toEqual(hops);
        });
    });
});
