# `babel-preset-hiro`: A Babel preset

A group of babel plugins used in the HIRO Graph JS libraries.

## usage

in `package.json`

```
{
  "devDependencies": {
    "babel-preset-hiro": "latest"
  },
  "babel": {
    "presets": ["hiro"]
  }
}
```

By default it does not transpile harmony modules (e.g. `import`/`export`) leaving them as is, which is useful for use with bundlers that can cope with this, e.g. webpack2, rollup, etc.

But if you are transpiling a library, you probably want commonjs modules for compatibility. To do this, simply pass the option into the babel config:

```
{
  "devDependencies": {
    "babel-preset-hiro": "latest"
  },
  "babel": {
    "presets": [
        ["hiro", {"library: true"}]
    ]
  }
}
```
