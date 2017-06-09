/**
 *  Helper functions for getting data from oauth implicit auth flow.
 */
import { createStrategy } from "hiro-graph-implicit-oauth";
import { popupStrategy } from "hiro-graph-implicit-oauth/lib/popup";
import { iframeStrategy } from "hiro-graph-implicit-oauth/lib/iframe";
import { redirectStrategy } from "hiro-graph-implicit-oauth/lib/redirect";

import {
    setToken,
    setOnLogoutHook,
    setOnTokenInvalidate,
    taskSuccess,
    taskError,
    taskLoading,
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
                { type: "me" },
                { token: accessToken }
            )
            .then(
                me => {
                    const myRoles = me["/roles"];
                    const myId = me["ogit/_id"];
                    const currentMe = getMyId(getState());
                    if (currentMe && currentMe !== myId) {
                        window.location.reload(); // a hard refresh is best.
                    }
                    //put vertex into ORM cache
                    orm.insertRaw(me, orm);
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

const builtInStrategies = {
    popup: popupStrategy,
    iframe: iframeStrategy,
    redirect: redirectStrategy
};

/**
 *  The "strategy" option is one of the exports from "hiro-graph-implicit-oauth"
 *  We provide a shorthand for the common ones, so you don't have to add the depenency explitictly
 */
export default function setupImplicitOauth(
    { url, clientId, redirectUri, logoutUri, store, ...options },
    strategySpec = "popup"
) {
    const strategy = typeof strategySpec === "string"
        ? builtInStrategies[strategySpec]
        : strategySpec;
    let shouldReallyLogout = false;
    const strategyLogout = typeof strategy.logout === "function"
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
        setOnTokenInvalidate(() => {
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
}
