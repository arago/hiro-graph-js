# `hiro-graph-implicit-oauth`: Implicit OAuth flow helper

A simple oauth implicit flow, with options for a Popup or a Redirect based

## installation

```bash
$ npm install hiro-graph-implicit-oauth
```

## Usage example

```javascript

import { Popup } from "hiro-graph-implicit-oauth"

const config = {
    url: "https://your/authorize/url...",
    clientId: "...yourClientId"
};

// Your login button
const loginButton = document.getElementById("loginButton")

const { check, request } = Popup(config);

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

// Trigger implicitOauth when clicked (open popup)
loginButton.addEventListener("click", () => request(authCallback));

```

