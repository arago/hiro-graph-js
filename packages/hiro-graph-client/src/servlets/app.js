const APPS_BASE = '/api/6.1/app';

export default function appsServletFactory(fetch, options) {
    return {
        getAll() {
            return fetch(`${APPS_BASE}/desktop`, options);
        },

        getMy() {
            return fetch(`${APPS_BASE}/desktop/installed`, options);
        },

        install(appId) {
            return fetch(`${APPS_BASE}/install/${appId}`, {
                ...options,
                method: 'POST',
            });
        },

        uninstall(appId) {
            return fetch(`${APPS_BASE}/uninstall/${appId}`, {
                ...options,
                method: 'POST',
            });
        },
    };
}
