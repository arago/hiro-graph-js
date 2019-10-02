const filterUndef = obj =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }
        return ret;
    }, {});

export default {
    getMeProfile: (fetch, options) =>
        fetch(`/api/7.0/graph/me/profile`, options),
    updateMeProfile: (fetch, options, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/7.0/graph/me/profile`, options);
    },
    getMeAvatar: (fetch, options) =>
        fetch(`/api/7.0/graph/me/avatar`, { ...options, raw: true }),
    meAccount: (fetch, options) => fetch(`/api/7.0/graph/me/account`, options),
    mePassword: (fetch, options, oldPassword, newPassword) => {
        options.method = "PUT";
        options.body = JSON.stringify({
            oldPassword,
            newPassword
        });
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/7.0/graph/me/password`, options);
    },
    meTeams: (fetch, options) => fetch(`/api/7.0/graph/me/teams`, options),
    updateMeAvatar: (fetch, options, data) => {
        options.method = "PUT";
        options.body = data;
        options.headers["Content-Type"] = data.type;
        options.raw = true;

        return fetch(`/api/7.0/graph/me/avatar`, options);
    }
};
