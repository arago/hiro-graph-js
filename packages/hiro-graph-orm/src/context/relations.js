import * as multi from "./relations-multi-method";
import * as alias from "./relations-alias-method";

const implementations = {
    multi: multi,
    alias: alias
};

let current = "multi";

export function useImplementation(name) {
    if (name in implementations) {
        current = name;
    } else {
        console.warn(`unknown implementation: "${name}"`);
    }
    return current;
}

export const fetchVertices = (...args) =>
    implementations[current].fetchVertices(...args);
export const fetchIds = (...args) => implementations[current].fetchIds(...args);
export const fetchCount = (...args) =>
    implementations[current].fetchCount(...args);
export const getRelationQuery = (...args) =>
    implementations[current].getRelationQuery(...args);
