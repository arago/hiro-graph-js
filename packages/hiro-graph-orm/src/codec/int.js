/**
 *  Integer marshalling is more complex than you would think.
 *  In order to enable sorting on these fields, we have to zero-pad them.
 *  This is because the string values are lexical sorted, so "10" comes before "2" but not "02".
 *
 *  We zero-pad to MAX_SAFE_INTEGER to account for javascripts float-only number system.
 *
 *  Instead of checking for an integer, we simply Math.floor the values.
 *
 *  To account for sign, we subtract negative numbers from MAX_SAFE_INTEGER and prefix with a marker,
 *  positive numbers are prefixed with a different marker.
 *
 *  This has the unfortunate effect of making the database values non-human-readable, but allows sane sorting.
 *
 *  If you do not need negative numbers it is more natural (and probably more performant) to
 *  use the `uint` type.
 */
import { encodeInt as encode, decodeInt as decode } from "./_number_utils";

export default { encode, decode };
