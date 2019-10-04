# Access Tokens.

The OAuth flow for access tokens included here requires a little setup.

Once you have created the store (see [middleware and reducers](./middleware-and-reducer.md)) you can setup the implicit oauth flow:

```javascript
import { implicitOauth } from "@hiro-graph/redux";

const store = { /* redux store with `@hiro-graph/redux` enhancement */ };

implicitOauth(
    {
        url: "<url to the HIRO Graph instance>"
        logoutUri: "<url to the HIRO Graph Logout URL>",
        clientId: "<OAuth client id for you application>",
        redirectUri: "<the redirect URL for your OAuth application, exactly as in the OAuth configuration>",
        store: store, // the reduxStore
        dispatch: store.dispatch // explicitly yhe store dispatch function
    }
);
```
