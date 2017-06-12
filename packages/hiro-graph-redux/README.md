# `hiro-graph-redux`: Graph ORM redux middleware

This is middleware/reducer combo, a custom `Token`, an action creator and some actions for redux that wraps the Graph ORM (`hiro-graph-orm`).

## Documentation

Please see [`./docs`](/packages/hiro-graph-redux/docs/README.md)

## Example

```javascript
import HiroGraphORM from "hiro-graph-orm";
import schema from "path/to/schema/mappings";

import {
    createAction,
    createStoreEnhancer,
    graphReducer,
    createToken
} from "hiro-graph-redux";

import {
    createStore,
    combineReducers
} from "redux";

const endpoint = "http://graph:8888";
// hiro-graph-redux will use the hiro-graph-implicit-oauth,
// `createToken` instantiates a new token handler for the
// redux application.
const token = createToken();
const orm = new HiroGraphORM({ endpoint, token }, schema);

const reducers = combineReducers(reducers, reducer);

//createStore from redux
const store = createStore(
    createReducer(token),
    initialState,
    createStoreEnhancer(orm)
);

//make an action creator.
const myAction = createAction(({ orm, dispatch }, ...args) => {
    return orm.findById(args).then(nodes => {
        //do something with nodes.
        //dispatch(something else)?
    });
});

store.dispatch(actionCreator("id", "id2"));
```
