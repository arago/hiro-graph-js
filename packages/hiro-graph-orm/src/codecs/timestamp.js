/**
 *  Timestamp is a millisecond precision unix timestamp.
 *
 *  because it is stored as a string, it is only valid for ordering
 *  while millisecond timestamps have 13 digits. That means you can only
 *  use timestamps that fall in the range:
 *  from ~ "Sun, 09 Sep 2001 01:46:39 GMT"
 *  to ~ "Sat, 20 Nov 2286 17:46:40 GMT"
 *
 *  It's altogether a better idea to use ISO8601 timestamps
 */
import iso, { isoRegex } from "./iso8601";

const TS_LOWER_BOUND = 999999999999;
const TS_UPPER_BOUND = 10000000000000;

export default {
    decode: s => {
        let n = parseInt(s, 10);
        if (isoRegex.test(s)) {
            n = iso.decode(s);
        }
        return isNaN(n) || n < TS_LOWER_BOUND || n > TS_UPPER_BOUND ? null : n;
    },
    encode: s => {
        let n;
        if (typeof s === "string") {
            n = parseInt(s, 10);
        } else {
            n = 1 * s; //cast to number...
        }
        //now finally if a reasonable number, cast back to string...
        return isNaN(n) || n < TS_LOWER_BOUND || n > TS_UPPER_BOUND
            ? null
            : "" + n;
    }
};
