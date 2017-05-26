# Codecs

When creating codecs with `createCodec` or defining entities for use with `createEntity` the possible values a codec descriptor are:

## `string`

Simply keeps values as strings, coercing if necessary.

```javascript
const { encode, decode } = createCodec("string");

console.log(encode("hello")); //-> "hello"
console.log(encode(123)); //-> "123"
console.log(decode(123)); //-> "123"
console.log(decode(true)); //-> "true"
console.log(encode()); //-> ""
console.log(decode(null)); //-> ""
```

## `list`

A list of comma-seperated values, (no comma's allowed in values).

```javascript
const { encode, decode } = createCodec("list");

console.log(encode("hello")); //-> "hello"
console.log(encode("hello,world")); //-> "hello, world"
console.log(encode(["hello", "world"])); //-> "hello, world"
console.log(decode("hello")); //-> ["hello"]
console.log(decode("hello, world")); //-> ["hello", "world"]
console.log(decode("hello, 123")); //-> ["hello", "123"]
console.log(encode(["hello", 123])); //-> "hello, 123"
```

## `uint`

An unsigned integer. This is stored in the database in a human readable form. It is left-padded with zeros to ensure lexical sorting matches the numerical value sort.

```javascript
const { encode, decode } = createCodec("uint");

console.log(encode(1)); //-> "0000000000000001"
console.log(encode(-1)); //-> "0000000000000001"
console.log(decode("0000000000000009")); //-> 9
console.log(decode("foo")); //-> 0
console.log(encode("not a number")); //-> "0000000000000000"
console.log(encode(NaN)); //-> "0000000000000000"
console.log(encode(Infinity)); //-> "0000000000000000"
const big = decode(encode(Number.MAX_SAFE_INTEGER + 1)));
console.log(big === Number.MAX_SAFE_INTEGER); //-> true
```

## `int`

A signed integer. This allows negative values, but in order to keep lexical sorting the values are not human readable inside the database. This also means they are less likely to be compatible with other programs writing the data.

Because the data are not human readable, I will not give examples here, except that the same caveats about `Number.MAX_SAFE_INTEGER`, `NaN` and `Infinity` hold.

```javascript
const { encode, decode } = createCodec("int");

console.log(encode("not a number")); //-> "0000000000000000"
console.log(encode(NaN)); //-> "0000000000000000"
console.log(encode(-Infinity)); //-> "0000000000000000"

const big = decode(encode(Number.MAX_SAFE_INTEGER + 1)));
console.log(big === Number.MAX_SAFE_INTEGER); //-> true

const small = decode(encode((-1 * Number.MAX_SAFE_INTEGER) - 1)));
console.log(small === -1 * Number.MAX_SAFE_INTEGER); //-> true
```

## `json`

Stores objects serialised as JSON in the database. The values are parsed on decode, and stringified on encode. Invalid values are ignored.


```javascript
const { encode, decode } = createCodec("json");

console.log(encode("hello")); //-> "hello"
console.log(encode({ hello: "world" })); //-> `{"hello":"world"}`
console.log(decode(`{"hello":"world"}`)); //-> { hello: "world" }
```

## `bool`

The default boolean conversion. `true` if and only if the string equals `"true"`.

```javascript
const { encode, decode } = createCodec("bool");

console.log(encode(true)); //-> "true"
console.log(encode(false)); //-> "false"
console.log(encode("false")); //-> "true" (string "false" is *truthy*)
console.log(decode("false")); // -> false
console.log(decode("true")); // -> true
console.log(decode("True")); // -> false (case sensitive)
```


## `bool:<true>:<?false>`

Other boolean representations can be created with a string of this form. The `<true>` and `<?false>` values are passed to `createBool` to return a custom codec.

```javascript
const { encode, decode } = createCodec("bool:foo:bar");
console.log(encode(true)); //-> "foo"
console.log(encode(false)); //-> "bar"
console.log(encode("false")); //-> "foo" (string "false" is *truthy*)
console.log(decode("random")); // -> false (not === "foo")
console.log(decode("foo")); // -> true
console.log(decode("Foo")); // -> false (case sensitive)

//with only truth specified
const { encode, decode } = createCodec("bool:foo");

console.log(encode(true)); //-> "foo"
console.log(encode(false)); //-> null (this would *unset* the value in the db)
console.log(encode("false")); //-> "foo" (string "false" is *truthy*)
console.log(decode("random")); // -> false (not === "foo")
console.log(decode("foo")); // -> true
console.log(decode("Foo")); // -> false (case sensitive)
```

## `timestamp`

A millisecond prescision timestamp. These are sortable only while a millisecond UNIX timestamp retains the same number of digits. This is from ~`Sun, 09 Sep 2001 01:46:39 GMT` to ~`Sat, 20 Nov 2286 17:46:40 GMT`


```javascript
const { encode, decode } = createCodec("timestamp");

const date = new Date("Fri, 27 Jun 2016 11:46:39 GMT")

console.log(encode(date)); //-> "1467027999000"
console.log(encode(date.getTime()); //-> "1467027999000"
console.log(encode("not a date")); //-> null

console.log(decode("1467027999000")); //-> 1467027999000
console.log(decode("not a date")); //-> null

const tooEarly = new Date("Sun, 09 Sep 2001 01:00:00 GMT");
console.log(encode(tooEarly)); //-> null
console.log(decode("" + tooEarly.getTime())); //-> null

const tooLate = new Date("Sat, 20 Nov 2286 20:00:00 GMT");
console.log(encode(tooEarly)); //-> null
console.log(decode("" + tooEarly.getTime())); //-> null
```

## `iso8601`

A better way to store time information, as an `iso8061` formatted string. Decoded to a millisecond timestamp.

```javascript
const { encode, decode } = createCodec("iso8601");

const date = new Date("Fri, 27 Jun 2016 11:46:39 GMT")
const tooEarlyForTimestamp = new Date("Sun, 09 Sep 2001 01:00:00 GMT");
const tooLateForTimestamp = new Date("Sat, 20 Nov 2286 20:00:00 GMT");

console.log(encode(date)); //-> "2016-06-27T11:46:39.000Z"
console.log(encode(tooEarlyForTimestamp)); //-> "2001-09-09T01:00:00.000Z"
console.log(encode(tooLateForTimestamp)); //-> "2286-11-20T20:00:00.000Z"

```

## `enum:<value>:<value>...`

An `enum` codec only allows the set of values you supply, any others will be translated to `null`. See `createEnum`.

```javascript
const { encode, decode } = createCodec("enum:foo:bar:baz");

console.log(encode("foo")); //-> "foo"
console.log(encode("bar")); //-> "bar"
console.log(encode("baz")); //-> "baz"
console.log(encode("quux")); //-> null

console.log(decode("foo")); //-> "foo"
console.log(decode("bar")); //-> "bar"
console.log(decode("baz")); //-> "baz"
console.log(decode("quux")); //-> null
```

## `identity`

Does no conversion either way. Used for the internal `ogit/_*` props that can have non-string values. You probably won't need to use this one.

```javascript
const { encode, decode } = createCodec("identity");

const obj = {}

console.log(encode(obj) === obj); //-> true
console.log(decode(obj) === obj); //-> true
```
