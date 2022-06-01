# How To Publish

https://www.npmjs.com/settings/hiro-ui/packages

```
yarn publish
```

Once the NPM publish has been successful, push the master branch and tags to origin.

```
git push origin master --tags
```

This updates the repository with the correctly published tags, and the package.json with the new tags in.

https://github.com/arago/hiro-graph-js/blob/master/package.json#L4
