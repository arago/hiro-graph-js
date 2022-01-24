import qs from 'qs';

import { ACTION_LOG_API_BASE } from '../api-version';

export default function actionLogServletFactory(fetch, options) {
    return {
        logEvent(event) {
            return fetch(`${ACTION_LOG_API_BASE}/activity/event`, {
                ...options,
                method: 'POST',
                body: JSON.stringify(event),
            });
        },
        getOrganizationEvents(orgId, queryOptions = {}) {
            const query = qs.stringify(queryOptions);

            return fetch(
                `${ACTION_LOG_API_BASE}/organization/${orgId}/events?${query}`,
                options,
            );
        },
    };
}
