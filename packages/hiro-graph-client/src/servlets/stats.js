/**
 *  Stats servlet (used by the dashboard)
 */
import { stringify } from 'querystring';

export default {
    counter(fetch, options, { organization, type = 'daily' }) {
        const url = '/_stats/counter?' + stringify({ organization, type });

        return fetch(url, options);
    },
};
