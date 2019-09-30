/**
 *  Servlet extension for the "/_ki/" endpoints.
 */

export default {
    validate(fetch, options, { ki = '', ...rest }) {
        options.method = 'POST';
        options.body = JSON.stringify({
            ki,
            ...rest,
        });

        return fetch('/api/6/ki/check', options)
    },
};
