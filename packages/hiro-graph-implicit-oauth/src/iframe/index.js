import createStrategy from '../base';

/**
 *  Creates the login window in an iframe.
 *
 *  Probably the most versatile of the strategies in terms of
 *  UX, but the most complex because you will have to manage the
 *  display,
 */

const iframeStrategy = function({ url, key, iframe = false }) {
    const CALLBACK_KEY = key('callback');

    return {
        isRemote() {
            return window.parent !== window;
        },

        callLocalCallback(err, token) {
            //i.e from remote
            const fn = window.parent[CALLBACK_KEY];

            if (typeof fn === 'function') {
                delete window.parent[CALLBACK_KEY]; //cleanup
                console.log('iframe callback', err, token);
                fn(err, token);
            }
        },

        requestToken(callback) {
            let $iframe;

            if (iframe === false) {
                //create one.
                $iframe = document.createElement('IFRAME');
            } else if (typeof iframe === 'string') {
                //assume an id
                $iframe = document.getElementById(iframe);
            } else if (typeof iframe === 'function') {
                //could be a "getter"
                $iframe = iframe();
            } else {
                //assume a real iframe element.
                $iframe = iframe;
            }

            if ($iframe instanceof HTMLIFrameElement === false) {
                throw new Error('Could not get iframe for login!');
            }

            //set callback
            window[CALLBACK_KEY] = (err, token) => {
                callback(err, token);
            };
            $iframe.src = url;

            //remember to attach to the DOM, or something. ;)
            return $iframe;
        },
    };
};

export default createStrategy(iframeStrategy);

export { iframeStrategy };
