// All the complexity needed to come up with a fake store with a fake orm
// with some fake type mappings
/**
 *  Load our environment variables and configure the HIRO Graph pieces
 */
import { combineReducers, createStore } from 'redux';

import createMockClient from '@hiro-graph/client/lib/mock';
import mappings, { createProfile, createAccount } from './mappings';
import {
    createToken,
    graphReducer,
    createStoreEnhancer,
    implicitOauth,
} from '../src/index';

// but we need some globals that the implicit oauth uses.
const noop = () => {};

global.window = {
    localStorage: { removeItem: noop, setItem: noop, getItem: noop },
    location: { origin: 'mock://app', hash: '#', search: '?', href: '' },
};

// Our app configuration
const createReduxStoreAndClient = () => {
    const client = createMockClient(createToken());
    /**
     * The orm needs to be hooked into the redux store via a storeEnhancer
     */
    const reduxEnhancer = createStoreEnhancer(client, mappings);

    /**
     *  We build our redux store now.
     */
    const store = createStore(
        combineReducers({ ...graphReducer }),
        reduxEnhancer,
    );

    // now we have to fake the implicit oauth. We do this by creating a fake Strategy.

    /**
     *  This accepts the redux store, and wraps the oauth flow
     *  We use the default OAuth strategy
     */
    implicitOauth(
        {
            url: 'mock://graphit',
            logoutUri: 'mock://logout',
            clientId: 'clientId',
            redirectUri: 'mock://redirect',
            store: store,
            dispatch: store.dispatch,
        },
        () => ({
            logout() {
                // do nothing.
            },
            isRemote() {
                // pretend
                return false;
            },
            requestToken(callback) {
                // don't do anything
                setTimeout(() => {
                    // the orm will make a request to "me" immediately. we need to be ready for that.
                    client.enqueueMockResponse({
                        account: createAccount('me'),
                        profile: createProfile('me'),
                    });
                    callback(null, {
                        accessToken: 'redux-token',
                        meta: { expiry: Date.now() + 3600e3 },
                    });
                }, 0);
            },
        }),
    );

    return { client, store };
};

export default createReduxStoreAndClient;
