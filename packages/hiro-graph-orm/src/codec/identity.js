/**
 *  Identity does no coercion.
 */
 const identity = (x) => x;
 export default {
     decode: identity,
     encode: identity,
 };