import { AUDIT_API_BASE } from '../api-version';

export default function actionLogServletFactory(fetch, options) {
    return {
        logEvent(event) {
            return fetch(`${AUDIT_API_BASE}/activity/event`, {
                ...options,
                method: 'POST',
                body: JSON.stringify(event),
            });
        },
    };
}
