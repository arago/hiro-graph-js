/**
 *  Servlet extension for the "/variables/" endpoints.
 */
import { stringify } from "querystring";

export default {
    add(fetch, options, data = {}) {
        options.method = "PUT";
        options.body = JSON.stringify(data);

        return fetch("/api/6/variables/", options);
    },

    suggest(fetch, options, { name, full = true, ...rest }) {
        const url = encodeURI(
            "/api/6/variables/suggest?" +
                stringify({
                    name,
                    full,
                    ...rest
                })
        );

        return fetch(url, options);
    },

    define(fetch, options, { name, ...rest }) {
        const url = encodeURI(
            `/api/6/variables/define?${stringify({
                name,
                rest
            })}`
        );

        return fetch(url, options)
            .then(res => ({
                isTodo: res["ogit/Automation/todo"] || false
            }))
            .catch(() => undefined);
    }
};
