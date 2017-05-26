# Implicit Oauth

A simple oauth implicit flow, with options for a Popup or a Redirect based 


## Usage example

```javascript

import { Popup } from "@arago/js-implicit-oauth"

const config = {
    url: "https://your/authorize/url...",
    clientId: "...yourClientId"
};

// Your login button
const loginButton = document.getElementById("loginButton")

const { check, request } = Popup(config, (err, token) => {
    if (err) {
        //something bad happened :(
    }
    if (token) {
        // User logged in successfully
        // access token at `token.accessToken`
        // metadata at `token.meta`
        document.write("Logged In: " + token.accessToken);
    }
});

//perform passive login check
check();

// Trigger implicitOauth when clicked (open popup)
loginButton.addEventListener("click", request);
```

