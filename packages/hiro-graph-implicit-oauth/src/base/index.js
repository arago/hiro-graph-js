import querystring from "querystring";

/**
 *  This is the core strategy.
 *  despite the differing methods, Implicit OAuth always returns the token in a specific way in the hash fragment.
 *  we also store the token in localStorage in the same way.
 *  Therefore we can abstract those bits.
 *
 *  Also the concept of whether we are "local" i.e. in the page, or "remote", i.e.
 *  in the popup/frame/redirection process will be common, it's a bit like a "fork"
 *
 *  One branch of code is for the local, another for the remote.
 */

const createKey = clientId => key => `___${clientId}:${key}`;
const parseQuerystring = qs => querystring.parse(qs.replace(/^\?/, ""));
const parseFragment = fragment => querystring.parse(fragment.replace(/^#/, ""));
const getOrigin = (l = window.location) =>
    !l.origin
        ? l.protocol + "//" + l.hostname + (l.port ? ":" + l.port : "")
        : l.origin;
const defaultRedirectUri = () => getOrigin() + "/";

export default function createOauthStrategy(implementation) {
    return ({
        clientId,
        url: baseURL,
        redirectUri = defaultRedirectUri(),
        logoutUri,
        logoutReturnUrl,
        clearStorageOnLogout = true,
        ...options
    }) => {
        const key = createKey(clientId);
        const TOKEN_KEY = key("token");
        const token = {
            accessToken: null,
            meta: {}
        };
        const tokenIfOK = () => {
            if (token.accessToken) {
                return token;
            }
        };

        const url =
            baseURL +
            (baseURL.indexOf("?") > -1 ? "&" : "?") +
            querystring.stringify({
                client_id: clientId,
                redirect_url: redirectUri
            });

        const clear = () => window.localStorage.removeItem(TOKEN_KEY);

        const logout = tok => {
            if (clearStorageOnLogout) {
                clear();
            }
            return (
                logoutUri +
                "?" +
                querystring.stringify({
                    clientid_token: clientId + "." + tok,
                    return_url: logoutReturnUrl
                })
            );
        };

        //create our strategy for getting tokens.
        const strategy = implementation({
            clientId,
            url,
            key,
            redirectUri,
            ...options
        });

        //turns out these are useful to the consumer as well.
        const baseReturnValue = {
            clear,
            isRemote: () => strategy.isRemote(),
            isLocal: () => !strategy.isRemote()
        };

        if (strategy.isRemote()) {
            let error;
            //we are in the remote path. That means that we *SHOULD*
            //be checking for the token in the url fragment
            const frag = parseFragment(window.location.hash);
            if (frag.access_token) {
                token.accessToken = frag.access_token;
                const expiry =
                    Date.now() + parseInt(frag.expires_in, 10) * 1000;
                if (!isNaN(expiry)) {
                    token.meta.expiry = expiry;
                }
            } else {
                const {
                    error: errorType,
                    error_description: errDescription
                } = parseQuerystring(window.location.search);
                if (errorType && errDescription) {
                    token.meta.error = errDescription;
                    token.meta.errorType = errorType;
                    error = new Error(errDescription);
                    error.type = errorType;
                }
            }
            window.localStorage.setItem(TOKEN_KEY, JSON.stringify(token));

            //remote version of check.
            return Object.assign(baseReturnValue, {
                check() {
                    try {
                        strategy.callLocalCallback(error, tokenIfOK());
                    } catch (e) {
                        console.error(e);
                    }
                },
                request() {
                    //nothing to do here
                },
                logout() {
                    //nothing on remote side
                }
            });
        } else {
            // we are in the local path
            // try and pull from localstorage;
            let error = null;
            try {
                const fromStorage = JSON.parse(
                    window.localStorage.getItem(TOKEN_KEY)
                );
                if (
                    fromStorage.meta.expiry &&
                    fromStorage.meta.expiry < Date.now()
                ) {
                    //token expired, silently remove.
                } else if (fromStorage.meta.error) {
                    error = new Error(fromStorage.meta.error);
                    error.type = fromStorage.meta.errorType;
                    token.meta = fromStorage.meta;
                } else if (fromStorage.accessToken) {
                    token.accessToken = fromStorage.accessToken;
                    token.meta = fromStorage.meta;
                }
            } catch (e) {
                //do nothing.
            }

            //keep hold of the current token, so we can log it out.
            let currentToken = token && token.accessToken;

            return Object.assign(baseReturnValue, {
                //local version of check, just grabs the already present values.
                check(callback) {
                    callback(error, tokenIfOK());
                },
                //local version of request should trigger the oauth
                request(callback) {
                    return strategy.requestToken((err, tok) => {
                        //update our local knowledge of the token
                        currentToken = tok && tok.accessToken;
                        return callback(err, tok);
                    });
                },
                logout() {
                    // use the currentToken to logout.
                    const uri = logout(currentToken);
                    if (typeof strategy.logout === "function") {
                        strategy.logout(uri);
                    } else {
                        window.location.href = uri;
                    }
                }
            });
        }
    };
}
