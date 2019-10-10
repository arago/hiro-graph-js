/**
 *  Servlet extension for the "/variables/" endpoints.
 */
import { stringify } from "querystring";

const BASE_PATH = "/api/6/variables";

export default function variablesServletFactory(fetch, options) {
    return {
        add(data) {
            return fetch(BASE_PATH, {
                ...options,
                method: "PUT",
                body: JSON.stringify(data)
            });
        },

        suggest({ name, full = true, ...rest }) {
            const query = stringify({
                ...rest,
                name,
                full
            });

            const url = encodeURI(`${BASE_PATH}/suggest?${query}`);

            return fetch(url, options);
        },

        define({ name, ...rest }) {
            const url = encodeURI(
                `${BASE_PATH}/define?${stringify({
                    ...rest,
                    name
                })}`
            );

            return fetch(url, options);
        }
    };
}
