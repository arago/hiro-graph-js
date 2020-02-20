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
                        response: {
                            ...response,
                            error:
                                response.code !== 200 &&
                                (response.error.message || response.error),
                        },
                    };
                })
                .catch((responseError) => {
                    return {
                        valid: false,
                        response: {
                            error: responseError.toString(),
                        },
                    };
                });
        },
    };
}
