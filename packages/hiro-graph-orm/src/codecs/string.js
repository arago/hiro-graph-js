/**
 *  String ensure whatever is given is string.
 */
const stringify = (s) => {
    if (s === null || s === undefined) {
        return '';
    }

    if (typeof s === 'string') {
        return s;
    }

    return '' + s;
};

export default {
    decode: stringify,
    encode: stringify,
};
