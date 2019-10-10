export default function kiServletFactory(fetch, options) {
    return {
        validate({ ki, ...rest }) {
            return fetch("/api/6/ki/check", {
                ...options,
                method: "POST",
                body: JSON.stringify({
                    ...rest,
                    ki
                }),
                raw: true
            });
        }
    };
}
