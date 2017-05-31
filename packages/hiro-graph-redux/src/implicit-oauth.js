/**
 *  Helper functions for getting data from oauth implicit auth flow.
 */
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
    ({ dispatch, getState, orm }, { accessToken, meta }) => {
        return orm
            .getConnection()
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
                }
            );
    }
);

/**
 *  The "strategy" option is one of the exports from "@arago/js-implicit-oauth"
 */
export default function setupImplicitOauth(
    { url, clientId, redirectUri, logoutUri, store, ...options },
    strategy
) {
    const { check, request, logout } = strategy({
        url,
        clientId,
        redirectUri,
        logoutUri,
        ...options
    });
    check((_err, token) => {
        if (token) {
            store.dispatch(taskLoading(GRAPH_LOGIN));
            // we should still do the the "fetch me
            store.dispatch(fetchMeForToken(token));
            store.dispatch(taskSuccess(GRAPH_LOGIN, token.accessToken));
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
