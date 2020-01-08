const filterUndef = (obj) =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }

        return ret;
    }, {});

export default function apiServletFactory(fetch, options) {
    return {
        getMeProfile: () => fetch('/api/graph/7.1/me/profile', options),

        updateMeProfile: (data) => {
            const payload = filterUndef(data);

            return fetch('/api/graph/7.1/me/profile', {
                ...options,
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },

        getMeAvatar: () =>
            fetch('/api/graph/7.1/me/avatar', { ...options, raw: true }),

        meAccount: () => fetch('/api/graph/7.1/me/account', options),

        mePassword: (oldPassword, newPassword) => {
            return fetch('/api/graph/7.1/me/password', {
                ...options,
                method: 'PUT',
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });
        },

        meTeams: () => fetch('/api/graph/7.1/me/teams', options),

        updateMeAvatar: (data) => {
            return fetch('/api/graph/7.1/me/avatar', {
                ...options,
                method: 'POST',
                body: data,
                headers: {
                    ...options.headers,
                    'Content-Type': data.type,
                },
                raw: true,
            });
        },
    };
}
