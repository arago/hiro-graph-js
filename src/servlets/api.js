import { AUTH_API_BASE } from '../api-version';

const filterUndef = (obj) =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }

        return ret;
    }, {});

export default function apiServletFactory(fetch, options) {
    return {
        getMeProfile: () => fetch(`${AUTH_API_BASE}/me/profile`, options),

        updateMeProfile: (data) => {
            const payload = filterUndef(data);

            return fetch(`${AUTH_API_BASE}/me/profile`, {
                ...options,
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },

        getMeAvatar: () =>
            fetch(`${AUTH_API_BASE}/me/avatar`, { ...options, raw: true }),

        meAccount: () => fetch(`${AUTH_API_BASE}/me/account`, options),

        mePassword: (oldPassword, newPassword) => {
            return fetch(`${AUTH_API_BASE}/me/password`, {
                ...options,
                method: 'PUT',
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });
        },

        meTeams: () => fetch(`${AUTH_API_BASE}/me/teams`, options),

        updateMeAvatar: (data) => {
            return fetch(`${AUTH_API_BASE}/me/avatar`, {
                ...options,
                method: 'PUT',
                body: data,
                headers: {
                    ...options.headers,
                    'Content-Type': data.type,
                },
                raw: true,
            });
        },

        meRoles: () => {
            return fetch(`${AUTH_API_BASE}/me/roles`, options);
        },
    };
}
