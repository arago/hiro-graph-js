# Access Tokens.

The OAuth flow for access tokens included here requires a little setup.

Once you have created the store (see [middleware and reducers](./middleware-and-reducer.md)) you can setup the implicit oauth flow:

```javascript
import { implicitOauth } from "@hiro-graph/redux";
import popupStrategy from "@hiro-graph/implicit-oauth/lib/popup";

const store = { /* redux store with `@hiro-graph/redux` enhancement */ };

implicitOauth(
    {
        url: "<url to the HIRO Graph instance>"
        logoutUri: "<url to the HIRO Graph Logout URL>",
        clientId: "<OAuth client id for you application>",
        redirectUri: "<the redirect URL for your OAuth application, exactly as in the OAuth configuration>",
        store: store, // the reduxStore
        dispatch: store.dispatch // explicitly yhe store dispatch function
    },
    popupStrategy // you don't have to use the popup strategy
);
```

## Available OAuth strategies.

-   `Popup`: this trigger the login window in a popup.
    -   Pros: don't loose page state, can show status to user
    -   Cons: popups may be blocked, definitely requires use interaction to be allowed.
-   `Iframe`: this loads the login window in an iframe.
    -   Pros: don't loose page state, does not require a user interaction to load the login page
    -   Cons: Some SSO solutions will block being loaded in an iframe.
-   `Redirect`: this redirect the current page to the login page.
    -   Pros: never disallowed like popups, does not require a user interaction to load the login page.
    -   Cons: Much harder to retain page state, URL will be lost on return.

You may build your own strategy as well, see [`@hiro-graph/implicit-oauth`](/packages/@hiro-graph/implicit-oauth/).
