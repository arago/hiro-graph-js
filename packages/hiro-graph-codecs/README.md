# `@hiro-graph/codecs`: String-to-type mappers

HIRO Graph only allows storing string values, so if we wish to infer more meaningful types to those values we need to encode them. Also, as in the graph all values are strings, in order to sanely sort our values, they need to sort lexically when encoded.

This package cover both those use-cases. It is integrated into `@hiro-graph/orm` so you can define mappings for fields with types and have the conversion to and from string values done transparently. Most codecs handle bad input values by providing a zero value in the case

## installation

```bash
$ npm install --save @hiro-graph/codecs
```

## usage

This package is not often used alone, but should you wish to:

```javascript
import codec from "@hiro-graph/codecs";

const int = codec.int;

console.log(int.encode(101)) // "p0000000000000101"
console.log(int.encode(-101)) // "n9007199254740890"
console.log(int.encode("this is not a number")) // "p0000000000000000"

console.log(int.decode("n9007199254740890")) // -101
console.log(int.decode("I am not a number")) // 0
```
