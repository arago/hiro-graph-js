/**
 *  Represents a GraphIT Access Token.
 *
 *  Access is always a promise, as we may have to renew it.
 *
 *  both `onInvalidate()` and `getToken()` can return promises.
 *  `getMeta` should return synchronously.
 */
export default class Token {
    constructor({ onInvalidate = () => {}, getMeta = () => {}, getToken }) {
        this._onInvalidate = onInvalidate;
        this._getMeta = getMeta;
        this._getToken = getToken;
    }

    get() {
        if (!this._tokenPromise) {
            this._tokenPromise = Promise.resolve(this._getToken())
                .catch(err => {
                    //flatten this, so another attempt can be made
                    this._tokenPromise = null;
                    //returning a bogus token (null), should hopefully trigger this again,
                    //waiting subscribers will receive it, fail, and try again.
                    console.error("ERROR GETTING TOKEN!", err);
                    return null;
                })
                .then(token => {
                    this._invalidated = false; //this resolved one way or another...
                    return token;
                });
        }
        return this._tokenPromise;
    }

    invalidate() {
        if (this._invalidated) {
            return;
        }
        this._tokenPromise = false;
        this._invalidated = true;
        return Promise.resolve(this._onInvalidate()).catch(() => {});
    }

    //returns nothing by default, but you may want to synchronously return the
    //last valid token, the time is was acquired, it's expiry, a refresh token, etc...
    meta() {
        return this._getMeta();
    }
}
