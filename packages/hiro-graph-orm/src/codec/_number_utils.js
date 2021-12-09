/**
 *  Extracting Number functions to a common module
 *
 *  Numbers are tricky because we want to ensure that they are lexically sortable.
 * @ignore
 */

//see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

//these should lexically sort with negative lowest and be only one character.
//unfortunately "-" and "+" do not sort this way... :(
const NEGATIVE_MARKER = 'n';
const POSITIVE_MARKER = 'p';

//this is how long out padding should be
const PAD_LENGTH = ('' + MAX_SAFE_INTEGER).length;

//the user should pass an integer. We truncate if not.
//also, if `signed` and the number is negative,
// we subtract from MAX_SAFE_INTEGER to ensure the correct sort order.
const integerMagnitude = (number = NaN, { signed = false } = {}) => {
    const n = Number(number);

    if (!isFinite(n) || isNaN(n)) {
        return 0;
    }

    let mag = Math.min(Math.floor(Math.abs(number)), MAX_SAFE_INTEGER);

    if (mag > MAX_SAFE_INTEGER) {
        mag = MAX_SAFE_INTEGER;
    }

    return signed && number < 0 ? MAX_SAFE_INTEGER - mag : mag;
};

//left pad an integer for sorting.
const lexicalPad = (integer, prefix = '') => {
    const string = '' + integer;
    const zeroes = PAD_LENGTH - string.length;

    return `${prefix}${'0'.repeat(zeroes)}${string}`;
};

/**
 * @ignore
 */
export const encodeUInt = (number) => lexicalPad(integerMagnitude(number));

/**
 * @ignore
 */
export const encodeInt = (number) => {
    const prefix = number < 0 ? NEGATIVE_MARKER : POSITIVE_MARKER;

    return lexicalPad(integerMagnitude(number, { signed: true }), prefix);
};

/**
 * decode a string expecting a plain unsigned int.
 * @ignore
 */
export const decodeUInt = (string) => {
    //first we should check if this is a signed int representation,
    //and discard sign (for ease of compatibility)
    return Math.abs(decodeInt(string));
};

/**
 * Decode a signed number string
 * @ignore
 */
export const decodeInt = (string) => {
    let digits = string.slice(1);
    const sign = string[0];

    if (sign !== POSITIVE_MARKER && sign !== NEGATIVE_MARKER) {
        //no marker assume positive with sign omitted.
        digits = sign + digits;
    }

    const negative = sign === NEGATIVE_MARKER;
    const number = parseFloat(digits);

    if (!isFinite(number) || isNaN(number)) {
        return 0;
    }

    return Math.round(negative ? number - MAX_SAFE_INTEGER : number);
};