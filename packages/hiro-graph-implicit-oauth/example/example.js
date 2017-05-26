import { Popup, Redirect } from "../src";
const url = "https://sso-stage.graphit.co/oauth2/authorize";
const clientId = "GfIKtBk6pxnyEYKT8h0h4dDBHHwa";

// try both of these!
const strategy = Popup;
//const strategy = Redirect;

//log out by clearing local storage
const logout = function() {
    window.localStorage.clear();
    window.location.reload();
};

// create the implicit auth instance
const { check, request } = strategy({ url, clientId }, (err, token) => {
    if (err) {
        document.write("<h1>" + err.message + "</h1>");
    }
    if (token) {
        document.write("<h1>Logged In</h1><pre>" + JSON.stringify(token, null, "  ") + "</pre>");
    }
});

// login button
const btn = document.createElement("button");
btn.innerHTML = "Login";
btn.onclick = request;
document.body.appendChild(btn);

// logout button
const out = document.createElement("button");
out.innerHTML = "Logout";
out.onclick = logout;
document.body.appendChild(out);

// trigger passive check
check();
