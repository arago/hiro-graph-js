import qs from 'qs';

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
        getOrganizationEvents(orgId, queryOptions = {}) {
            const query = qs.stringify(queryOptions);

            return fetch(
                `${AUDIT_API_BASE}/organization/${orgId}/events?${query}`,
                options,
            );
        },
        getAccountEvents(accountId, queryOptions = {}) {
            const query = qs.stringify(queryOptions);

            return fetch(
                `${AUDIT_API_BASE}/account/${accountId}/events?${query}`,
                options,
            );
        },
    };
}
