/**
 *  This is a redux aware token.
 */
import { Token } from '@hiro-graph/client';

import { setToken } from './actions';
import { getTokenState } from './reducer';

export default class ReduxToken extends Token {
    constructor({ onInvalidate = () => {} } = {}) {
        super({
            onInvalidate: () => {
                this._redux_dispatch(setToken()); //remove token from store.

                return Promise.resolve(this._redux_onInvalidate()).then(() =>
                    onInvalidate(),
                );
            },
            getToken: () => {
                return new Promise((resolve) => {
                    //if we have a token, let's get it.
                    const existingToken = getTokenState(this._redux_getState())
                        .accessToken;

                    if (existingToken) {
                        resolve(existingToken);

                        return;
                    }

                    //if we don't have a token, we need to wait for something external to
                    //set it.
                    const unsubscribe = this._redux_subscribe(() => {
                        const newToken = getTokenState(this._redux_getState())
                            .accessToken;

                        if (newToken) {
                            unsubscribe();
                            resolve(newToken);
                        }
                    });
                });
            },
        });

        const usedTooEarly = () => {
            throw new Error(
                'Attempt to use ReduxToken before middleware initialized',
            );
        };

        this._redux_dispatch = usedTooEarly;
        this._redux_getState = usedTooEarly;
        this._redux_subscribe = usedTooEarly;
    }

    //this is the bit of magic that our middleware uses
    connect({ dispatch, getState, subscribe }, onInvalidate) {
        this._redux_dispatch = dispatch;
        this._redux_getState = getState;
        this._redux_subscribe = subscribe;
        this._redux_onInvalidate = onInvalidate;
    }
}
