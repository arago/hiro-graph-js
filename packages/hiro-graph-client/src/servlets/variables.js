/**
 *  Servlet extension for the "/_variables/" endpoints.
 */
import { stringify } from 'querystring';

export default {
    add(fetch, options, { name, description, todo, type = 'any' } = {}) {
        const data = {
            'ogit/name': name,
            'ogit/description': description,
            'ogit/Automation/todo': todo,
            'ogit/subType': type,
        };

        options.method = 'PUT';
        options.body = JSON.stringify(data);

        return fetch('/_variables', options);
    },

    get(fetch, options, name) {
        const url = '/_variables/define?' + stringify({ name });

        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';

        return fetch(url, options);
    },

    suggest(fetch, options, name) {
        const url = '/_variables/suggest?' + stringify({ name });

        return fetch(url, options);
    },
};
