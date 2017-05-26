/**
 *  Copes with values that have complex values stored as strings
 */
export default {
    decode: s => {
        try {
            return JSON.parse(s);
        } catch (e) {
            //no valid json return as is.
            return s;
        }
    },
    encode: s => {
        try {
            return JSON.stringify(s);
        } catch (e) {
            //should we throw here, or swallow silently...
            return null;
        }
    }
};
