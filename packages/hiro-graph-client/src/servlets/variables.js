/**
 *  Servlet extension for the "/variables/" endpoints.
 */
import { stringify } from 'querystring';

import { VARIABLES_API_BASE } from '../api-version';

export default function variablesServletFactory(fetch, options) {
    return {
        add(data) {
            return fetch(VARIABLES_API_BASE, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },

        suggest({ name, full = true, ...rest }) {
            const query = stringify({
                ...rest,
                name,
                full,
            });

            const url = encodeURI(`${VARIABLES_API_BASE}/suggest?${query}`);

            return fetch(url, options);
        },

        define({ name, ...rest }) {
            const url = encodeURI(
                `${VARIABLES_API_BASE}/define?${stringify({
                    ...rest,
                    name,
                })}`,
            );

            return fetch(url, options);
        },
    };
}
