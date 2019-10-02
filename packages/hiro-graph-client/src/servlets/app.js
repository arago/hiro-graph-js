const APPS_BASE = "/api/6.1/app";

export default {
    getAll(fetch, opts) {
        return fetch(`${APPS_BASE}/desktop`, opts);
    },

    getMy(fetch, opts) {
        return fetch(`${APPS_BASE}/desktop/installed`, opts);
    },

    install(fetch, opts, appId) {
        return fetch(`${APPS_BASE}/install/${appId}`, {
            ...opts,
            method: "POST"
        });
    },

    uninstall(fetch, opts, appId) {
        return fetch(`${APPS_BASE}/uninstall/${appId}`, {
            ...opts,
            method: "POST"
        });
    }
};
