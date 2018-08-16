# Validating a Schema against an Ontology

The OGIT ontology is a well-defined set of attributes and entities and possible connections between them all. Our schema defines much the same sort of data. 

It would be easy to reference an attribute that doesn't exist or is forbidden on an entity, or to not add one that is required by OGIT.

Therefore there is a tool installed by default alongside this package to validate such.

## Usage `yarn validate`

`yarn validate <mappings module> <OGIT ontology location>`

 - **`<mappings module>`** should be the path to a module that exports a mapping for us to validate.
 - **`<OGIT ontology location>`** should be the path to a single YAML file (like the `graphit-ontology.yaml` distributed with GraphIT) or a directory structure like [the OGIT repo](https://github.com/arago/OGIT).

The response will be either:

```javascript 
{
    errors: 0,
    detail: {}
}
```

Which is what you want or:

```javascript
{
    errors: n,
    detail: {
        EntityName: [
            "some error",
            "another error"
            ...
        ],
        ...
    }
}
```

Which you don't want. The error messages are pretty verbose and should help you sort out any issues.
