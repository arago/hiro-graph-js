# Middleware and Reducer

In `redux` **middleware**/**storeEnhancer** allows your store to do new things and handle new actions. A **reducer** is a function which responds to those actions by updating state. We will talk about **actions** later.

In order to configure your redux store for use with `hiro-graph-redux` you need to add the middleware and reducer. The reducer handles all the state updates for our actions and the middleware provides the `hiro-graph-orm` magic and task handling.

N.B. The storeEnhancer function needs a [`hiro-graph-orm`](https://github.com/arago/hiro-graph-js/packages/hiro-graph-orm) `Context` object.

```javascript
import { createStore, compose, combineReducers } from "redux";
import { storeEnhancer, graphReducer } from "hiro-graph-redux";

import { appReducers } from "src/app/reducers";
import { graphContext } from "src/app/graph-context"; // hiro-graph-orm Context

/**
 *  Here is where we add our custom reducers, the graphReducer is vital
 *  for correct functioning of the `hiro-graph-redux` middleware
 */
const reducers = combineReducers({ ...appReducers, ...graphReducer });

/**
 *  We build our redux store now.
 */
const store = createStore(
    reducers,
    compose(
        storeEnhancer(graphContext),
        window.devToolsExtension ? window.devToolsExtension() : f => f
    )
);

- next: [Creating Action Creators](/docs/action-creators.md)
