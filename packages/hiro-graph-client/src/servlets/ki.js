import { KI_API_BASE } from '../api-version';

export default function kiServletFactory(fetch, options) {
    return {
        validate({ ki, ...rest }) {
            return fetch(`${KI_API_BASE}/check`, {
                ...options,
                method: 'POST',
                body: JSON.stringify({
                    ...rest,
                    ki,
                }),
                raw: true,
            })
                .then((response) => response.json())
                .then((response) => {
                    return {
                        valid: response.code === 200,
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
    };
}
