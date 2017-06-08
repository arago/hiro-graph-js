# `connect`ing React Components

`redux` provides a way to `connect` react components to the `redux` store, notifying them of changes. This is done with 2 functions:

 1. `mapStateToProps` which converts your `redux` state to props for your component.
 2. `mapDispatchToProps` which gives your component the ability to dispatch actions on the store.

The first (`mapStateToProps`) is where we will focus here. This module provides helpers for plucking data out of the private internal state. This includes task status, vertex data, the access token information and "me" associated with that token.

## IMPORTANT

If you remember nothing else, remember this:

> **Inside the action handlers, we deal with vertex objects, inside React components we deal with plain JS objects.**

That is your components should only get data, not access to perform side effects.

## `createVertexSelector`

This is used to get vertex data out of the store. The function takes an argument that will be used to map state to the id or ids of the vertices you want.

```javascript
import React from "react";
import { connect } from "redux";

import { createVertexSelector } from "hiro-graph-redux";

//of course your own reducers are responsible for managing your state
const myVertexSelector = createVertexSelector(state => state.myVertices);

const component = ({ vertices }) => {
    if (vertices && vertices.length) {
        return <ul>
            {vertices.map(v => <li key={v._id}>{JSON.stringify(v)}</li>}
        </ul>;
    }
    return <div>No Vertices</div>;
}

const mapStateToProps = state => {
    return {
        vertices: myVertexSelector(state)
    };
}

export default connect(mapStateToProps)(component);
```

## `createTaskSelector`

This one is similar to the vertex selector but for tasks. It takes just the task id and returns the current task state or nothing. If your task returns an id, or an array of ids, then this selector will also pluck out the available vertex data form the store (internally using `createVertexSelector`).

> You most likely will not need to use `createTaskSelector` directly, as you will want to use the selector returned from the task creation.

Task data is described further in [Tasks in Detail](/packages/hiro-graph-redux/docs/tasks.md).

- next: [Access Token handling (and implicit oauth)](/packages/hiro-graph-redux/docs/token-handling.md)





