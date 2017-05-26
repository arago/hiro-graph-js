import createStrategy from "../base";

// Simple strategy that simple bumps the user to the new page
// and back again afterwards
const redirectStrategy = function({ url, redirectUri }) {
    return {

        isRemote() {
            return /access_token/.test(window.location.hash);
        },

        callLocalCallback() {
            //basically we got the token, which means it is in localstorage. redirect back to local page
            window.location = redirectUri;
        },

        requestToken() {
            //bump to auth page
            window.location = url;
        }
    };
};

export default createStrategy(redirectStrategy);

export { redirectStrategy };
