import createStrategy from "../base";

/**
 *  This strategy uses a popup window.
 */
const popupStrategy = function({ url, key, width = 500, height = 600 }) {
    const OPENER_CALLBACK_KEY = key("callback");
    const strategy = {
        isRemote() {
            const opener = window.opener;
            if (!opener) {
                return false;
            }
            //but opener may not be us!
            try {
                //just accessing this object will throw a DOMException is cross origin
                window.opener.location.href; //eslint-disable-line
                // so we are same-origin if here.
                return true;
            } catch (e) {
                //DOMException cross-origin error.
                return false;
            }
        },

        callLocalCallback(error, token) {
            //i.e from remote
            const fn = window.opener[OPENER_CALLBACK_KEY];
            if (typeof fn === "function") {
                try {
                    delete window.opener[OPENER_CALLBACK_KEY]; //cleanup
                } catch (_err) {
                    window.opener[OPENER_CALLBACK_KEY] = undefined; //cleanup IE
                }
                fn(error, token);
            }
        },

        requestToken(callback) {
            //from local
            let observationTimeout;
            const observeLoginPopup = () => {
                if (popup && popup.closed) {
                    //call the local callback.
                    callback(new Error("User Cancelled the Popup"));
                    return;
                }
                observationTimeout = setTimeout(observeLoginPopup, 1);
            };
            window[OPENER_CALLBACK_KEY] = (err, token) => {
                clearTimeout(observationTimeout);
                popup.close();
                callback(err, token);
            };
            const popup = createPopup(url, width, height);
            observeLoginPopup();
        }
    };

    return strategy;
};

export default createStrategy(popupStrategy);

export { popupStrategy };

const disabledFeatures = [
    "toolbar",
    "location",
    "directories",
    "status",
    "menubar",
    "resizable",
    "copyhistory"
]
    .map(v => v + "=no")
    .join(",");

const createPopup = (url, popWidth, popHeight) => {
    const dualScreenLeft =
        window.screenLeft !== undefined ? window.screenLeft : screen.left;
    const dualScreenTop =
        window.screenTop !== undefined ? window.screenTop : screen.top;
    const winWidth = window.innerWidth //eslint-disable-line no-nested-ternary
        ? window.innerWidth
        : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    const winHeight = window.innerHeight //eslint-disable-line no-nested-ternary
        ? window.innerHeight
        : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;

    const left = winWidth / 2 - popWidth / 2 + dualScreenLeft;
    const top = winHeight / 2 - popHeight / 2 + dualScreenTop;
    const openstring =
        disabledFeatures +
        ",top=" +
        top +
        ",left=" +
        left +
        ",width=" +
        popWidth +
        ",height=" +
        popHeight +
        "";
    let popup;
    try {
        popup = window.open(url, "login", openstring);
        popup.focus();
    } catch (e) {
        console.error(e);
    }
    return popup;
};
