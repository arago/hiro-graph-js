/**
 *  Codec define how we manipulate the (mostly) string data in GraphIT
 */
import string from "./string";
import list from "./list";
import uint from "./uint";
import int from "./int";
import json from "./json";
import { createEnum } from "./enum";
import bool, { createBool } from "./bool";
import timestamp from "./timestamp";
import identity from "./identity";
import iso8601 from "./iso8601";

//NB enum is NOT on this list.
const types = {
    string,
    list,
    uint,
    int,
    json,
    bool,
    timestamp,
    iso8601,
    identity
};

/**
 * Creates a encoder/decoder function pair for the type given.
 *
 * These are used by the {@link Schema} to map values to and from the
 * string-only types used in GraphIT. Theses are used in the property
 * definitions for entities (see {@link createEntity}).
 *
 * @see manual/usage.md#codecs
 * @param {string} name - The name of the codec to create
 *
 * @return {Codec} - the `encode`/`decode` functions
 */
export default function createCodec(name) {
    if (
        typeof name.encode === "function" &&
        typeof name.decode === "function"
    ) {
        return name; //this allows custom codecs or double calling of this function
    }

    if (name in types) {
        return types[name];
    }
    //special cases.
    if (name.indexOf("bool:") === 0) {
        //split on ":" and slice off the "bool"
        return createBool(...name.split(":").slice(1));
    }

    if (name.indexOf("enum:") === 0) {
        return createEnum(...name.split(":").slice(1));
    }

    //unknown
    console.warn(`unknown coercion type: ${name}`);
    return string;
}
