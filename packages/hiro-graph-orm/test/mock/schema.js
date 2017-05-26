import Schema from "../../src/schema";

const mockSchema = new Schema();

//add some definitions
mockSchema.define({
    name: "Simple",
    ogit: "ogit/Simple",
    required: {
        prop: "ogit/requiredProp",
        anotherProp: {
            src: "ogit/someOtherProp",
            type: "string"
        }
    },
    optional: {
        optionalProp: "/dontNeedThisOne"
    },
    relations: {
        simpleOutbound: "ogit/verbName -> ogit/OtherType",
        simpleInbound: "ogit/anotherVerb <- ogit/SomeOtherType"
    }
});

mockSchema.define({
    name: "Minimal",
    ogit: "ogit/Minimal"
});

const allTypes = [
    "string",
    "uint",
    "int",
    "bool",
    "json",
    "list",
    "timestamp",
    "iso8601",
    "identity"
].reduce(
    (acc, type) => {
        acc[type] = {
            src: "/" + type,
            type
        };
        return acc;
    },
    {
        enum: {
            src: "/enum",
            type: "enum:a:b:c"
        },
        customBool: {
            src: "/customBool",
            type: "bool:yes:no"
        }
    }
);

mockSchema.define({
    name: "AllTypes",
    ogit: "ogit/TypeTest",
    optional: allTypes
});

mockSchema.define({
    name: "ForExtremeQueryTest",
    ogit: "ogit/Extreme",
    required: Array(14).fill("").reduce((result, _, i) => {
        const key = "key" + (i + 1);
        result[key] = "/" + key;
        return result;
    }, {})
});

export default mockSchema;
