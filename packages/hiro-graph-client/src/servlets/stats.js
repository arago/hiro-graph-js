/**
 *  Stats servlet (used by the dashboard)
 */
import { stringify } from "querystring";

export default {
    counter(fetch, options, { organization, type = "daily", ...rest }) {
        const url = "/_stats/counter?" + stringify({ organization, type, ...rest });
        return fetch(url, options);
    }
};
