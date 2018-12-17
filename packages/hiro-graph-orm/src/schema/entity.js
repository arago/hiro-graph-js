/**
 *  The entity is an object which provides the information to
 *  convert database database results into application data and
 *  application queries into database format
 */
import codec from "hiro-graph-codecs";

const stringCodec = codec.string;
const listCodec = codec.list;
const identity = codec.identity;
const iso8601 = codec.iso8601;
// map an array of objects to an object keyed on the given key
const indexBy = key => (acc, obj) => ((acc[obj[key]] = obj), acc);

/**
 *  @ignore - internal only
 */
export const $dangerouslyGetProps = Symbol("dangerouslyGetProps");
/**
 *  @ignore - internal only
 */
export const $dangerouslyGetRelations = Symbol("dangerouslyGetRelations");
/**
 *  @ignore - internal only
 */
export const $dangerouslyGetDefinition = Symbol("dangerouslyGetDefinition");
/**
 *  @ignore - internal only
 */
export const $internal = Symbol("internal entity");

/**
 *  The entity is an object which provides the information to
 *  convert database database results into application data and
 *  application queries into database format.
 *
 *  @see manual/overview.html#schema
 *  @param {object} definition - the schema definition of this entity (see the manual)
 *  @param {Schema} schema - the actual schema this entity is defined in.
 *  @return {Entity}
 */
export default function createEntity(definition, schema) {
    const firstLetter = definition.name ? definition.name[0] : "x";
    if (!definition[$internal] && firstLetter !== firstLetter.toUpperCase()) {
        throw new Error(
            `entity defition name must start with a Capital letter (${
                definition.name
            })`
        );
    }
    const props = createPropList(
        schema,
        definition.name,
        definition.required,
        definition.optional,
        definition.virtual
    );
    const byDb = props.reduce(indexBy("src"), {});
    const byApp = props.reduce(indexBy("dst"), {});

    const shouldMapFreeAttributes =
        definition.includeUnmappedFreeAttributes === true;

    const getProp = name => {
        if (byApp[name]) {
            return byApp[name];
        }
        if (byDb[name]) {
            return byDb[name];
        }
        //nothing
        return;
    };

    const relations = createRelationMap(definition.relations);
    const getRelation = name => {
        if (relations[name]) {
            return relations[name];
        }
        //nothing
        return;
    };

    const convert = (encode = true) => input => {
        return objectEntries(input).reduce((output, [key, value]) => {
            const prop = encode ? byApp[key] : byDb[key];
            if (!prop) {
                //this might be missing, or it may be free.
                //if we are decoding, we have access to unmapped free props.
                if (
                    !encode &&
                    isFreeAttribute(key) &&
                    shouldMapFreeAttributes
                ) {
                    //this is a little different
                    addFreeAttribute(output, key, value);
                }
                return output;
            } else if (encode && prop.immutable) {
                //skip readOnly fields on encode
                return output;
            }
            if (encode) {
                //remember null is used for unset, so pass-through
                output[prop.src] = value === null ? null : prop.encode(value);
            } else {
                output[prop.dst] = prop.decode(value);
            }
            return output;
        }, {});
    };

    const entity = Object.create(null, {
        ogit: {
            enumerable: true,
            value: definition.ogit
        },
        name: {
            enumerable: true,
            value: definition.name
        },
        relation: {
            enumerable: true,
            value: getRelation
        },
        prop: {
            enumerable: true,
            value: getProp
        },
        decode: {
            enumerable: true,
            value: convert(false)
        },
        encode: {
            enumerable: true,
            value: convert(true)
        },
        internal: {
            enumerable: true,
            value: definition[$internal] === true
        }
    });
    entity[$dangerouslyGetProps] = () => props;
    entity[$dangerouslyGetRelations] = () => relations;
    entity[$dangerouslyGetDefinition] = () => definition;
    return entity;
}

const internalProps = [
    {
        src: "ogit/_id",
        dst: "_id",
        encode: stringCodec.encode,
        decode: stringCodec.decode,
        required: false
    },
    {
        //_content and fields will be moved to ontology definition, e.g. github.com/arago/OGIT
        src: "ogit/_content",
        dst: "_content",
        encode: stringCodec.encode,
        decode: stringCodec.decode,
        required: false
    },
    {
        src: "ogit/_organization",
        dst: "_organization",
        encode: stringCodec.encode,
        decode: stringCodec.decode,
        required: false
    },
    {
        src: "ogit/_owner",
        dst: "_owner",
        encode: listCodec.encode,
        decode: listCodec.decode,
        required: false
    },
    {
        src: "ogit/_tags",
        dst: "_tags",
        encode: listCodec.encode,
        decode: listCodec.decode,
        required: false
    }
];

const readOnlyProps = [
    "ogit/_created-on",
    "ogit/_modified-on",
    "ogit/_created-by",
    "ogit/_modified-by"
].map(src => ({
    src,
    dst: src.split("/")[1],
    decode: identity.decode,
    encode: /-on$/.test(src) ? iso8601.encode : identity.encode,
    required: false,
    immutable: true
}));

const _typeProp = {
    src: "ogit/_type",
    dst: "_type",
    required: false
};
const typeProp = schema => {
    if ("encode" in _typeProp) {
        return _typeProp;
    }
    return Object.assign(_typeProp, {
        encode: name => schema.get(name).ogit,
        decode: ogit => schema.get(ogit).name
    });
};

//free attributes start with Slash.
const isFreeAttribute = prop => prop.indexOf("/") === 0;
//adding one goes into the free pot.
const addFreeAttribute = (output, key, value) => {
    if ("_free" in output === false) {
        output._free = {};
    }
    output._free[key.substring(1)] = value; //no coercion.
};

const restrictedPropsMap = internalProps
    .concat(readOnlyProps)
    .reduce((obj, prop) => ((obj[prop.src] = prop), obj), {});

const ensureFullProps = (name, base) => ([key, def]) => {
    const result = {
        dst: key
    };
    if (typeof def === "string") {
        Object.assign(result, { src: def }, codec("string"), base);
    } else {
        Object.assign(
            result,
            { src: def.src },
            codec(def.type || "string"),
            base
        );
    }
    // check for defined internal props.
    if (result.src in restrictedPropsMap) {
        const p = restrictedPropsMap[result.src];
        throw new Error(
            `Trying to redefine an internal property as '${result.dst}'. ` +
                `The property '${p.src}' will already be available as '${
                    p.dst
                }'. ` +
                `Check the schema mapping for entity '${name}'.`
        );
    }
    return result;
};

//to iterate objects easily
const objectEntries = obj => Object.keys(obj).map(key => [key, obj[key]]);

//create a flat array of props.
const createPropList = (
    schema,
    name,
    required = {},
    optional = {},
    virtual = {}
) => {
    //we add the defaults as well.
    const props = internalProps
        .concat([typeProp(schema)])
        .concat(readOnlyProps)
        .concat(
            objectEntries(required).map(
                ensureFullProps(name, { required: true })
            )
        )
        .concat(
            objectEntries(optional).map(
                ensureFullProps(name, { required: false })
            )
        )
        .concat(
            objectEntries(virtual).map(
                ensureFullProps(name, { immutable: true })
            )
        );
    // now check if anything is "double defined"
    const check = {};
    props.forEach(p => {
        if (p.immutable) {
            // it doesn't matter if immutable props have multiple definitions
            return;
        }
        if (p.src in check === false) {
            check[p.src] = [];
        }
        check[p.src].push(p);
    });
    const problems = Object.keys(check)
        .map(k => {
            if (check[k].length === 1) {
                return false;
            }
            return check[k];
        })
        .filter(Boolean);
    if (problems.length) {
        const message =
            `Conflicting property definitions in entity: ${name}.` +
            problems.map(
                defs =>
                    "\n" +
                    `OGIT property '${defs[0].src}' is mapped by ${
                        defs.length
                    } definitions (${defs.map(d => d.dst).join(", ")})`
            );
        throw new Error(message);
    }
    return props;
};

//parse the relations into a common format.
const createRelationMap = (relations = {}) => {
    return objectEntries(relations).reduce((map, [alias, def]) => {
        const relation = [];
        if (typeof def === "string" || !Array.isArray(def)) {
            relation.push(def);
        } else {
            relation.push(...def);
        }
        map[alias] = {
            alias,
            hops: relation.reduce(createRelation, [])
        };
        return map;
    }, {});
};

/**
 *  Create the long form relation object from a string or object
 *
 *  The object should look like this:
 *  {
 *      direction: "in" | "out",
 *      verb: "ogit/edgeType",
 *      vertices: [ "ogit/vertexType" ],
 *      filter: { "ogit/attribute": "ogit/value" }
 *  }
 *
 *  The string shorthand is
 *
 *  "ogit/edgeType -> ogit/vertexType|ogit/otherType, ..."
 *
 */
const createRelation = (hops, def) => {
    //if string, we must parse.
    if (typeof def === "string") {
        return parseRelationString(def).reduce(createRelation, hops);
    }
    const {
        direction,
        verb,
        filter = null,
        vertex = false,
        vertices = []
    } = def;
    const vertexTypes = [];
    //now check the minimal definition.
    if (direction !== "in" && direction !== "out") {
        throw new Error(
            `relation: direction must be "in" or "out" not: ${direction}`
        );
    }
    if (typeof verb !== "string" || verb.indexOf("ogit/") !== 0) {
        throw new Error(`relation: verb must be 'ogit/...' got: ${verb}`);
    }
    //this should be a single item, but it might get an array...
    if (vertex) {
        if (Array.isArray(vertex)) {
            vertexTypes.push(...vertex);
        } else {
            vertexTypes.push(vertex);
        }
    }
    //this is the one that should be used as an array, be we might get a single item.
    if (!Array.isArray(vertices)) {
        vertexTypes.push(vertices);
    } else {
        vertexTypes.push(...vertices);
    }
    // now check everything we got was a string.
    if (
        vertexTypes.some(r => typeof r !== "string") ||
        vertexTypes.length === 0
    ) {
        throw new Error(
            `relation: vertex must be a string, or an array of strings`
        );
    }
    //OK we have all the info we need, should we generate the gremlin base alias query now? nah.
    return hops.concat([
        {
            direction,
            filter,
            verb,
            vertices: vertexTypes
        }
    ]);
};

//parse the string form of the relation definition.
//
// the definition is in the form "verb dir type|type, verb dir type|type, ..."
const parseRelationString = string => {
    //split the parts into an array on comma.
    return string.split(/\s*,\s*/).map(rel => {
        //OK this is a single one.
        const [verb, dir, types, ...rest] = rel.split(/\s+/);
        //if there is "rest" then the definiton is probably done something wrong.
        if (rest.length) {
            throw new Error(
                `relation: error parsing '${rel}' - (if you need a filter, use the longhand object form)`
            );
        }
        let direction;
        switch (dir) {
            case "<-":
                direction = "in";
                break;
            case "->":
                direction = "out";
                break;
            default:
                direction = dir;
        }
        return {
            direction,
            verb,
            vertices: types.split("|").map(v => v.trim())
        };
    });
};
