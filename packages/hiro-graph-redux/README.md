# `hiro-graph-redux`: Graph ORM redux middleware

This is middleware/reducer combo, a custom `Token`, an action creator and some actions for redux that wraps the Graph ORM (`hiro-graph-orm`).

## Documentation

Please see [`./docs`](/packages/hiro-graph-redux/docs/README.md)

## Example

```javascript
import { Connection } from "hiro-graph-client";
import { Context, Schema } from "hiro-graph-orm";

import {
    createAction,
    createMiddleware,
    graphReducer,
    createToken
} from "@arago/graph-redux";

import {
    createStore,
    applyMiddleware,
    combineReducers
} from "redux";

const endpoint = "http://graph:8888";
const token = createToken();
const conn = new Connection({ endpoint, token });
const schema = new Schema(...);
const ctx = new Context(schema, conn);

const reducers = combineReducers(reducers, reducer);

//createStore from redux
const store = createStore(
    createReducer(token),
    initialState,
    applyMiddleware(createMiddleware(ctx))
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
