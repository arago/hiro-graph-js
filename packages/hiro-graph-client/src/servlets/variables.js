/**
 *  Servlet extension for the "/_variables/" endpoints.
 */
import { stringify } from "querystring";

export default {
    add(fetch, options, { name, description, todo, type = "any", ...rest } = {}) {
        const data = {
            "ogit/name": name,
            "ogit/description": description,
            "ogit/Automation/todo": todo,
            "ogit/subType": type,
            ...rest,
        };

        options.method = "PUT";
        options.body = JSON.stringify(data);

        return fetch("/_variables", options);
    },

    suggest(fetch, options, { name, full = true, ...rest }) {
        const url = encodeURI("/_variables/suggest?" + stringify({
            name,
            full,
            ...rest,
        }));

        return fetch(url, options);
    },

    define(fetch, options, { name, ...rest }) {
        const url = encodeURI(`/_variables/define?${stringify({
            name,
            rest,
        })}`);

        return fetch(url, options)
            .then((res) => ({
                isTodo: res['ogit/Automation/todo'] || false,
            }))
            .catch(() => undefined);
    },
};
