/**
 *  Creates a boolean coder/decoder function pair
 *
 *  Boolean Codecs can encode `true` or `false` in a variety of ways.
 *
 *  > Note that by omitting the `stringForFalse`, then `null` is used,
 *  > which "unset's" the property on a `false` value.
 *
 *  @param {string} [stringForTrue="true"] - the string to use to signify `true`
 *  @param {?string} [stringForFalse=null] - the string to use to signify `false` (or not expplicitly `true`)
 *  @return {Codec} The custom boolean codec
 */
 export function createBool(stringForTrue = 'true', stringForFalse = null) {
    return {
        decode: (s) => s === stringForTrue,
        encode: (s) => (s ? stringForTrue : stringForFalse),
    };
}

/**
 *  The default boolean export is one that maps to the strings
 *  "true" and "false".
 */
export default createBool('true', 'false');