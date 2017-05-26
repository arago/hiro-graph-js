/**
 *  simple deep clone
 *
 *  only works on primitives, arrays and plain objects.
 *
 *  @ignore - internal helper
 */
export function clone(object) {
    //is it an array?
    if (Array.isArray(object)) {
        return object.map(clone);
    }
    //is it an object?
    if (Object.prototype.toString.call(object) === "[object Object]") {
        return Object.keys(object).reduce(
            (acc, key) => ((acc[key] = clone(object[key])), acc),
            {}
        );
    }
    //assume a primitive
    return object;
}

/**
 *  Merge 2 objects, clone props from old, that don't exist on new.
 *  If they exist on new and are null, we remove but don't replace
 *
 *  NB. This mutates the data object.
 *
 *  @ignore
 */
export function merge(old = {}, data = {}) {
    Object.keys(old).forEach(key => {
        if (key in data === false) {
            data[key] = old[key];
        }
    });
    Object.keys(data).forEach(key => {
        if (data[key] === null) {
            delete data[key];
        }
    });
    return data;
}

/**
 * this is a "promise" friendly filter function
 *
 * e.g. .then(filter(x => x > 2)).then...
 * geared up for array-or-not semantics.
 *
 *  @ignore - internal helper
 */
export const filter = fn => input =>
    Array.isArray(input) ? input.filter(fn) : [input].filter(fn)[0]; //could be undefined...

/**
 *  decode the database results into Vertex objects.
 *
 *  @ignore - internal helper
 */
export const decodeResults = (ctx, entity) =>
    mapIfArray(item => {
        const decoder = entity.internal
            ? ctx.getEntity(item["ogit/_type"])
            : entity;
        try {
            return decoder.decode(item);
        } catch (e) {
            console.warn(`error converting entity (as ${decoder.name}):`, item);
        }
    });

/**
 *  map sync functions if array and singly if not.
 *
 *  @ignore - internal helper
 */
export const mapIfArray = fn => input =>
    Array.isArray(input) ? input.map(fn) : fn(input);

/**
 *  allow the function to act on one of more objects.
 *
 *  @ignore - internal helper
 */
export const mapPromiseIfArray = fn => input =>
    Array.isArray(input)
        ? Promise.all(input.map(fn))
        : Promise.resolve(fn(input));
