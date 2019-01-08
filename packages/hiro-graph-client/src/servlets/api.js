const filterUndef = obj =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }
        return ret;
    }, {});

export default {
    getMeProfile: (fetch, options) => fetch(`/me/profile`, options),
    updateMeProfile: (fetch, options, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/me/profile`, options);
    },
    getMeAvatar: (fetch, options) =>
        fetch(`/me/avatar`, { ...options, raw: true }),
    meAccount: (fetch, options) => fetch(`/me/account`, options),
    mePassword: (fetch, options, oldPassword, newPassword) => {
        options.method = "POST";
        options.body = JSON.stringify({
            oldPassword,
            newPassword
        });
        options.headers["Content-Type"] = "application/json";

        return fetch(`/me/password`, options);
    },
    meTeams: (fetch, options) => fetch(`/me/teams`, options),
    updateMeAvatar: (fetch, options, data) => {
        options.method = "POST";
        options.body = data;
        options.headers["Content-Type"] = null;

        return fetch(`/me/avatar`, options);
    }
};
