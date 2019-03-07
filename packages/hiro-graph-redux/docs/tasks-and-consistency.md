# Tasks and Consistency

A lot of the benefits of using `redux` and the `react` _flow_ style of writing web apps is the consistency your user interface gets. i.e. with a single source of truth, all parts of your application see the same data.

However, it is easy to take this for granted and make your user interface inconsistent. Tasks, while a useful abstraction of the async request/response flow, can sometimes lull us into a false sense of security.

For example, let's say we have a todo-list and we want to show the list, fetching the data with a task.

```javascript
const { action, selector } = createTask(orm => {
    return orm
        .me()
        .then(orm.fetchVertices("todos"))
        .then(me => me.getVertices("todos"));
});
```

At first glance this might seem like a sensible thing to do. Find my user, fetch the todos, then extract the todos from the user object.

However, this approach has a number of flaws and a `connect`'d component using the selector will suffer inconsistency if the connection data is modified externally.

Lets follow the flow.

1. task is dispatched (becomes `loading`)
2. data is returned for the `me()` call, the `fetchVertices` call is triggered
3. relation data is returned and `getVertices` extracts the relation data
4. the task state is `ok`
5. a component using the task selector will update and recieve the list of todos.

So a fair description of the created task is `get all "todo" vertices related to me at the point of dispatch`.

If we in a different task `connect` or `disconnect` another vertex our task result remains the same (still valid as per our previous description, but it does not contain the up to date relation data).

It would be better to produce a task that simply `fetch`'d the data. We know that `@hiro-graph/redux` maintains vertex properties and keeps individual vedrtices up to date.

Therefore if our task was:

```javascript
const { action, selector } = createTask(orm => {
    return orm.me().then(orm.fetchVertices("todos"));
});
```

Then it now fetches the relationship data, but returns the vertex we actually care about - the one that **has** those relations. In our `mapStateToProps` function we can call `res._rel["todosIds"]` to find the Ids of the related nodes **at the point of render**. Combining this with `createVertexSelector` we can efficiently get the data for the related vertices whilst maintaining that the relation remains valid across the app.

Let us look at the `mapStateToProps` we might use for this.

```javascript
import { whenTask, createVertexSelector } from "@hiro-graph/redux";

const { action, selector } = createTask(...as above...);

const emtpyArray = [];

const relatedDataSelector = state => {
    const task = selector(state); // get task state.
    let vertices = emptyArray;
    whenTask(task, { ok: result => {
        vertices = result._rel["todos"];
    }});
    return vertices;
}

function mapStateToProps(state) {
    return {
        todos: relatedDataSelector(state)
    };
}
```

OK, well that was a bit boiler-plate-heavy, when all we really wanted to say was how to transform the result, e.g. `result => result._rel["todos"]`.

So we have a `createTask` wrapper that provides this functionality, called `createLiveTask`. The whole thing could be written as:

```javascript
import { createLiveTask } from "@hiro-graph/redux";

const { action, selector } = createLiveTask(
    // NB this is in mutable space and async
    orm => orm.me().then(orm.fetchVertices(["todos"])),
    // NB this is in the immutable space and sync
    result => result._rel["todos"]
);

function mapStateToProps(state) {
    const task = selector(state); // this returns a `task` object but the `result`
    // when the task is `ok` is the mapped data: the `todos`
    return {
        task: selector(state)
    };
}
```
