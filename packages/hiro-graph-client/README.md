# HIRO Graph Client Javascript Library

This is an isomorphic HIRO Graph Client library which exports two named items, `Token` and `Connection`.

## Token

Is an Access Token for HIRO Graph, and the mechanics to retrieve/update itself.
I.e. it knows how to get a token and what to do when the token is considered invalidated.

The API is simple, you create your token with a function `getToken` that returns a promise for an access token. Additionally you can pass an `onInvalidate` callback that, as the name suggests, is called when the token has been deemed invalidated.

```
import { Token } from "hiro-graph-client";

//simple fixed token.
const fixedTok = new Token({ getToken: () => "some token" });

//using fetch http call to get an access token
const asyncTok = new Token({ getToken: () => {
    return fetch({ ... }).then(res => res.json()).then(json => json.access_token);
}});
```

## Connection

This is a persistent connection to the HIRO Graph server. With the HIRO Graph APIs exposed. It will work with WebSockets if possible, but fall's back to HTTP if not. It requires a `Token` which will then be used for all requests. All Exposed API methods return `Promise`s.

```
import { Connection } from "hiro-graph-client";

const conn = new Connection({ endpoint: "http://localhost:8888", token: someTokenInstance });
```

## Servlets

HIRO Graph exposes many plugins via `/_*` endpoints (as HTTP) and only the most common APIs are exposed here. In order to make arbitrary HTTP requests (with a valid Token) against HIRO Graph you can use `Connection.http.fetch` (and `Connection.http.defaultOptions()`) which acts just like the regular `fetch` API, but automatically adds the Access Token.

```
const options = conn.http.defaultOptions();
options.method = "POST";
options.body = '{"some":"data"}';
const url = "/_some/uri";
conn.http.fetch(url, options).then(res => {
    //...
});
```
