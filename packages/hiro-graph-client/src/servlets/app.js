import { APP_API_BASE } from '../api-version';

export default function appsServletFactory(fetch, options) {
    return {
        getAll() {
            return fetch(`${APP_API_BASE}/desktop`, options);
        },

        getMy() {
            return fetch(`${APP_API_BASE}/desktop/installed`, options);
        },

        install(appId) {
            return fetch(`${APP_API_BASE}/install/${appId}`, {
                ...options,
                method: 'POST',
            });
        },

        uninstall(appId) {
            return fetch(`${APP_API_BASE}/uninstall/${appId}`, {
                ...options,
                method: 'POST',
            });
        },
    };
}
