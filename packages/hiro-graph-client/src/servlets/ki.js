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
                    const valid = response.code === 200;

                    return {
                        valid,
                        response: {
                            ...response,
                            error:
                                !valid &&
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
