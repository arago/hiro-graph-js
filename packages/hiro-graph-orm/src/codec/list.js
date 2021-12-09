/**
 *  The list type is a comma-seperated list of entries in the db,
 *  but an array locally. We also accept a raw string locally
 */

 const toStringAndTrim = (input) => {
    if (input === undefined || input === null) {
        return '';
    }

    const string = '' + input;

    return string.replace(/(^\s*|\s*$)/g, '');
};

const decode = (string) => {
    let s = string;

    if (typeof string !== 'string') {
        s = '' + string;
    }

    return s
        .split(/\s*,\s*/)
        .map(toStringAndTrim) //cast values to string and trim them
        .filter(Boolean); //remove empty strings.
};

const encode = (array) => {
    let arr;

    if (!Array.isArray(array)) {
        arr = decode(array);
    } else {
        arr = array.map(toStringAndTrim).filter(Boolean);
    }

    return arr.join(', ');
};

export default { decode, encode };