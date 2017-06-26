# Action Creators

Actions in `redux` are plain objects with a given format. They inform the reducers what to do. However applications are advised not to create the action objects themselves as that would: a) make for brittle code, and b) restrict what can be done. `redux` can be extended with middleware to perform side-effects as a result of actions.

This is how we achieve the magic in this package.

The exported `createAction` and `createTask` are helpers that expose powerful side-effect capabilities to your components.

## IMPORTANT

| <h3>This module automatically stores and updates the vertices retrived from GraphIT.<br>You should **NOT** store the vertices in redux yourself unless you have a very good reason to do so.</h3> |
|:----------------:|
| You **SHOULD** save the id's in the state yourself and use `createVertexSelector` in `mapStateToProps` as described in [`connect`ing react components](/packages/hiro-graph-redux/docs/connecting-react-components). |


## `createAction`

The createAction function accepts a callback. The callback function will be called when the action is dispatched. It recieves at least one argument. The first argument is an object described below and the rest are the arguments passed in at the call site.

```javascript

const myActionHandler = function(
    {
        dispatch,   // redux store dispatch function
        getState,   // redux store getState function
        orm        // the `js-graph-orm` Context
    },
    ...args //the arguments passed when the action is created.
) {
    //here we can do all sorts of async things.
    //convention is to return a promise (or a value).
    //it will be converted to a `cancelablePromise`
    console.log(...args);
}

const action = createAction(myActionHandler);

//later
reduxStore.dispatch(action(1,2,3)) //  -> logs "1 2 3"
```

> The first argument is actually the `Context` itself. We have added the `dispatch` and `getState` redux functions to it. This means the signature of this function is either `function(orm, ...args)` or `function({ orm }, ...args)` and either will work.

## `createTask`

This is similar to `createAction` but creates a *task*. A task has a unique string key (optionally set by you, the user), and this action creator ensures only one running instance of this task runs at a time. It also store some meta-data about the task, whether is it loading, whether it was successful (and the results) or whether it failed (and the error). Tasks are also cancellable.

```javascript
import { createTask } from "hiro-graph-redux";

const myActionHandler = ({ orm }) => {
    return orm.find({})
        //promise resolves to all the id's as array
        .then(vertices => vertices.map(v => v._id)); 
}

const { action, selector } = createTask(myActionHandler);


reduxStore.dispatch(action());
reduxStore.dispatch(action()); //this would do nothing as the previous task would be in progress.

selector(getState()); //will return the current task state (probably loading).
```

> N.B. By convention **you should return** a single `ogit/_id` or an array of them, or a plain object with keys matching the previous conditions from your task handlers. This will fit in with the `mapStateToProps` selector functions described in the next section.

More info on [tasks](./tasks.md).

- next: [`connect`ing react components](./connecting-react-components.md)
