/**
 *  Servlet extension for the "/_ki/" endpoints.
 */
import { stringify } from "querystring";

export default {
    validate(fetch, options, xml = "") {
        options.method = "POST";
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";
        options.body = stringify({ xml });

        return fetch("/_ki/validate", options);
    },

    autocomplete(fetch, options, type, data) {
        const url = "/_ki/autocomplete?" + stringify({ type });

        options.method = "POST";
        options.body = stringify({ data });
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";

        return fetch(url, options);
    }
};
