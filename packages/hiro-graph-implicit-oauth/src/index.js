/*

    Implicit Oauth.

    There are a few options to HOW, but here's the deal.

    each implementation should be instantiated like:

    const { check, request } = implementation({
        url: "auth url",
        clientId: "oauth client id"
        ...implementation options
    }, callback(error, { accessToken, meta }) {

    });

    return 2 things.

    check() - a function that passively checks for auth complete. If it is, the callback is called.
    request() - do whatever this implementation does to get a token
*/
import createStrategy from "./base";
import Redirect from "./redirect";

export { createStrategy, Redirect };
