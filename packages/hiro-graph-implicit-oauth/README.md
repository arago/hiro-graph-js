# `@hiro-graph/implicit-oauth`: Implicit OAuth flow helper

A simple oauth implicit flow

## installation

```bash
$ npm install @hiro-graph/implicit-oauth
```

## Usage example

```javascript
import { Redirect } from "@hiro-graph/implicit-oauth"

const config = {
    url: "https://your/authorize/url...",
    clientId: "...yourClientId"
};

// Your login button
const loginButton = document.getElementById("loginButton")

const { check, request } = Redirect(config);

const authCallback = (err, token) => {
    if (err) {
        //something bad happened :(
        console.warn(err);
    }
    if (token) {
        // User logged in successfully
        // access token at `token.accessToken`
        // metadata at `token.meta`
        document.write("Logged In: " + token.accessToken);
    }
});

//perform passive login check
check(authCallback);

// Trigger implicitOauth when clicked
loginButton.addEventListener("click", () => request(authCallback));
```

