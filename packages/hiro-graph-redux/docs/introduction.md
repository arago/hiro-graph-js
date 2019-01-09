# Introduction

[`hiro-graph-redux`](https://github.com/arago/hiro-graph-js/packages/hiro-graph-redux/) is a library to help make GraphIT applications using Redux for state management. It extends the concepts of the [`@hiro-graph/orm`](https://github.com/arago/hiro-graph-js/packages/@hiro-graph/orm) to a redux enabled application.

The core concept is that it enforces the side-effects of GraphIT interaction to action handlers, making your application ahere nicely to the uni-directional flow of events (_flux_).

The results of all GraphIT requests are stored into the redux state. Any components can subscribe to state changes and therefore it should be easier to keep your application state consistent.

To use it you must add the middleware and the reducer to your redux store. Then you can create actions which have access to the graph-orm.

-   next: [Middleware and Reducer](./middleware-and-reducer.md)
