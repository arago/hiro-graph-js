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

    validateKiLang(fetch, options, kilang = '') {
        options.method = 'POST';
        options.body = JSON.stringify({ ki: kilang });
        options.raw = true;

        return fetch('/api/6/ki/check', options)
            .then((response) => response.json())
            .then((response) => {
                if (response.code >= 400) {
                    return {
                        valid: false,
                        response,
                    };
                }

                return {
                    valid: true,
                    response,
                };
            })
            .catch((error) => {
                return {
                    valid: false,
                    response: error.message,
                };
            });
    },

    autocomplete(fetch, options, type, data) {
        const url = "/_ki/autocomplete?" + stringify({ type });

        options.method = "POST";
        options.body = stringify({ data });
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";

        return fetch(url, options);
    }
};
