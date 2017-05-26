/**
 *  Stores positive integer data. (discards sign)
 *
 *  because it is a string, we use the *easiest* (not the most compact or versatile) format
 *  that is still sortable.
 *
 */
import { encodeUInt as encode, decodeUInt as decode } from "./_number_utils";

export default { encode, decode };
