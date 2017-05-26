# Middleware and Reducer

In `redux` **middleware** allows your store to do new things and handle new actions. A **reducer** is a function which responds to those actions by updating state. We will talk about **actions** later.

In order to configure your redux store for use with `redux-graph` you need to add the middleware and reducer. The reducer handles all the state updates for our actions and the middleware provides the `js-graph-orm` magic and task handling.

N.B. The createMiddleware function needs a [`js-graph-orm`](https://github.com/arago/js-graph-orm) `Context` object.

```javascript
import { createStore, applyMiddleware, combineReducers } from "redux";
import { createMiddleware, graphReducer } from "@arago/redux-graph";

const context = { /* js-graph-orm context */ };

const reducers = combineReducers(Object.assign({ /* your own reducers */ }, graphReducer));

const middlewares = [
    createMiddleware(context),
    /* your own middlewares */
];

const initialReduxState = { /* however you want to get this */ };

const store = createStore(reducers, initialReduxState, applyMiddleware(...middlewares));
```

- next: [Creating Action Creators](/docs/action-creators.md)
