# `@hiro-graph/client`: HIRO Graph API Client Javascript Library

This is an isomorphic HIRO Graph Client library which exports, by default a `Client` and a named export: `Token`.

## installation

```bash
$ npm install @hiro-graph/client
```

## Client

This is a client which performs the API calls against the HIRO Graph API for you, mantaining a persistent connection to the server. It will work with WebSockets if possible, but falls back to HTTP if not. It requires a `Token` which will then be used for all requests. All Exposed API methods return `Promise`s.

```javascript
import Client from "@hiro-graph/client";

const client = new Client({
    endpoint: "http://localhost:8888/api/6.1",
    token: someTokenInstance
});
```

The second argument to Client can be a `Transport` if you have a custom one, or a set of options for the client. If websockets are available, i.e. most modern browsers and when in node.js, then the default transport is a pool of websockets. The pool only has one socket by default, as in the browser this is most likely what you want, however on the backend you may wish to up this to more than a single connection.

```javascript
import Client from "@hiro-graph/client";

const client = new Client({
        endpoint: "http://localhost:8888/api/6.1",
        token: someTokenInstance
    }, {
        poolSize: 10
    });
```

## Token

Is an Access Token for HIRO Graph, and the mechanics to retrieve/update itself.
I.e. it knows how to get a token and what to do when the token is considered invalidated.

The API is simple, you create a token with a function `getToken` that returns a promise for an access token. Additionally you can pass an `onInvalidate` callback that, as the name suggests, is called when the token has been deemed invalidated.

```javascript
import { Token } from "@hiro-graph/client";

// Simple fixed token.
const fixedTok = new Token({ getToken: () => "some token" });

// Using fetch http call to get an access token
const asyncTok = new Token({ getToken: () => {
    return fetch({ ... }).then(res => res.json()).then(json => json.access_token);
}});
```

More information on authenticating against the HIRO IAM can be found in the [HIRO Docs](https://docs.hiro.arago.co/hiro/current/developer/hiro-graph-api/index.html#how-to-get-a-token)

## Servlets

HIRO Graph exposes many plugins via `/_*` endpoints (as HTTP) and only the most common APIs are exposed here. See the [servlets](/src/servlets/) directory for more info.

In order to make arbitrary HTTP requests (with a valid Token) against HIRO Graph you can use `Client.http.fetch` (and `Client.http.defaultOptions()`) which acts just like the regular `fetch` API, but automatically adds the Access Token.

```javascript
const options = client.http.defaultOptions();
options.method = "POST";
options.body = '{ "some": "data" }';
const url = "/_some/uri";
conn.http.fetch(url, options).then(res => {
    //...
});
```

## EventStream (missing feature)

The code exists for EventStream processing is only alpha at the moment. Recommended not to use as yet, and as such it is not exported directly.
