/**
 *  Servlet extension for the "/_ki/" endpoints.
 */

export default {
    validate(fetch, options, { ki = "", ...rest }) {
        options.method = "POST";
        options.body = JSON.stringify({
            ki,
            ...rest
        });

        if (options.raw === undefined) {
            options.raw = true;
        }

        return fetch("/api/6/ki/check", options);
    }
};
