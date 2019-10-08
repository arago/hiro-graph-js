/**
 *  Helper functions for getting data from oauth implicit auth flow.
 */
import createStrategy from "./create-oauth-strategy";

import {
    setToken,
    setOnLogoutHook,
    setOnTokenInvalidate,
    taskSuccess,
    taskError,
    taskLoading,
    resetTask,
    setLoginTrigger,
    GRAPH_LOGIN
} from "./actions";
import { createAction } from "./create-action";
import { createTaskSelector, getMyId } from "./reducer";

export const loginTaskSelector = createTaskSelector(GRAPH_LOGIN);

//we have to side-step here because if we allow the token to be "set", then
//then pending requests will start and the "me" value will be empty.
//
const fetchMeForToken = createAction(
    (
        { dispatch, getState, orm },
        { accessToken, meta },
        { callOnFail = false } = {}
    ) => {
        return orm
            .getClient()
            .http.request(
                //force http transport.
                null /* we don't use a token object here, but supply a fixed one - perhaps the api should update */,
                { type: "getme" },
                { token: accessToken }
            )
            .then(
                ({ account: me, profile }) => {
                    const myRoles = me["/roles"];
                    const myId = me["ogit/_id"];
                    const currentMe = getMyId(getState());

                    if (currentMe && currentMe !== myId) {
                        window.location.reload(); // a hard refresh is best.
                    }

                    //put vertex into ORM cache
                    orm.insertRaw(me, orm);
                    orm.insertRaw(profile, orm);

                    //when it is in, continue
                    orm._notifyCacheFlush(() => {
                        dispatch(setToken(accessToken, meta, myId, myRoles));
                        dispatch(taskSuccess(GRAPH_LOGIN, accessToken));
                    });
                },
                err => {
                    dispatch(setToken());
                    dispatch(taskError(GRAPH_LOGIN, err.message));
                    if (callOnFail) {
                        callOnFail();
                    }
                }
            );
    }
);

const redirectStrategy = function({ url, redirectUri }) {
    return {
        isRemote() {
            return /access_token/.test(window.location.hash);
        },

        callLocalCallback() {
            //basically we got the token, which means it is in localStorage. redirect back to local page
            window.location = redirectUri;
        },

        requestToken() {
            //bump to auth page
            window.location = url;
        }
    };
};

const builtInStrategies = {
    redirect: redirectStrategy
};

export default function setupImplicitOauth(
    { url, clientId, redirectUri, logoutUri, store, ...options },
    strategySpec = "redirect"
) {
    const strategy =
        typeof strategySpec === "string"
            ? builtInStrategies[strategySpec]
            : strategySpec;
    let shouldReallyLogout = false;
    const strategyLogout =
        typeof strategy.logout === "function"
            ? strategy.logout
            : uri => (window.location.href = uri);

    strategy.logout = uri => {
        if (shouldReallyLogout) {
            strategyLogout(uri);
        }
    };
    const { check, request, logout } = createStrategy(strategy)({
        url,
        clientId,
        redirectUri,
        logoutUri,
        ...options
    });
    check((_err, token) => {
        if (token) {
            store.dispatch(taskLoading(GRAPH_LOGIN));
            // we should still do the the "fetch me", but we need to ensure the logout is triggered on failure (as the token is no longer valid)
            store
                .dispatch(fetchMeForToken(token, logout))
                .then(() => (shouldReallyLogout = true)); //after this is done, reset the value of shouldRedirectOnLogout
        } else {
            shouldReallyLogout = true;
        }
    });
    store.dispatch(setOnLogoutHook(logout));
    store.dispatch(
        setLoginTrigger(() => {
            // we need an explicit function to say: this is what you do on login.
            store.dispatch(taskLoading(GRAPH_LOGIN));
            request((err, token) => {
                if (err) {
                    store.dispatch(setToken());
                    store.dispatch(taskError(GRAPH_LOGIN, err));
                } else if (token) {
                    //here we ensure we have "me" before we return.
                    store.dispatch(fetchMeForToken(token));
                } else {
                    store.dispatch(setToken());
                    store.dispatch(
                        taskError(
                            GRAPH_LOGIN,
                            new Error("no token in response")
                        )
                    );
                }
            });
        })
    );
    store.dispatch(
        setOnTokenInvalidate(() => {
            // we can't do the login on invalidate (like we used to)
            // it happens without user intervention and we cannot trigger this without user consent
            // popups for example will not happen.
            // what we can do is RESET the login task and kill the token
            store.dispatch(setToken());
            store.dispatch(resetTask(GRAPH_LOGIN));
        })
    );
}
