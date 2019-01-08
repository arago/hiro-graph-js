const filterUndef = obj =>
    Object.keys(obj).reduce((ret, k) => {
        if (obj[k] !== undefined) {
            ret[k] = obj[k];
        }
        return ret;
    }, {});

export const auth = {
    organizationTeams: (fetch, options, id) =>
        fetch(`/api/6.1/iam/organization/${id}/teams`, options),
    updateMeProfile: (fetch, options, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/me/profile`, options);
    },
    mePassword: (fetch, options, oldPassword, newPassword) => {
        options.method = "POST";
        options.body = JSON.stringify({
            oldPassword,
            newPassword
        });
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/me/password`, options);
    },
    updateAccountProfile: (fetch, options, id, data) => {
        const payload = filterUndef(data);

        options.method = "POST";
        options.body = JSON.stringify(payload);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/accounts/profile/${id}`, options);
    },
    getAvatar: (fetch, options, id) =>
        fetch(`/api/6.1/iam/accounts/${id}/avatar`, { ...options, raw: true }),
    createTeam: (fetch, options, data) => {
        options.method = "POST";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/team`, options);
    },
    updateTeam: (fetch, options, id, data) => {
        options.method = "PUT";
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/team/${id}`, options);
    },
    deleteTeam: (fetch, options, id) => {
        options.method = "DELETE";
        options.headers["Content-Type"] = "application/json";

        return fetch(`/api/6.1/iam/team/${id}`, options);
    }
};
