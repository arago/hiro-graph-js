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
        delete options.headers["Content-Type"];

        const formData = new FormData();
        const payload = filterUndef(data);
        Object.keys(payload).forEach(k => formData.append(k, payload[k]));

        options.method = "POST";
        options.body = formData;

        return fetch(`/api/6.1/iam/me/profile`, options);
    },
    updateAccountProfile: (fetch, options, id, data) => {
        delete options.headers["Content-Type"];

        const formData = new FormData();
        const payload = filterUndef(data);
        Object.keys(payload).forEach(k => formData.append(k, payload[k]));

        options.method = "POST";
        options.body = formData;

        return fetch(`/api/6.1/iam/accounts/profile/${id}`, options);
    }
};
