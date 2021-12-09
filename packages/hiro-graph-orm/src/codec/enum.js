/**
 *  Creates a coder/decoder with a fixed set of possible values.
 *
 *  @param {Array<string>} options - The list of values this enum can take.
 *  @return {Codec} the custom enum codec
 */
 export function createEnum(...options) {
    const _enum = options.reduce((acc, val) => ((acc[val] = val), acc), {});
    const check = (s) => (s in _enum ? s : null);

    return {
        decode: check,
        encode: check,
    };
}