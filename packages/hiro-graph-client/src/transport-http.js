/**
 *  The HTTP version of the transport.
 *  It support the `request` method,
 *  But translates them to `fetch` methods.
 */
import fetch from 'isomorphic-fetch';

import { create as createError } from './errors';
import { AUTH_API_BASE, GRAPH_API_BASE } from './api-version';
import timer from './timer';

const noop = () => {};

export default class HttpTransport {
    constructor(endpoint) {
        this.endpoint = endpoint.replace(/\/$/, ''); //remove trailing slash.
    }

    //this is basically window.fetch with a token.get() before it.
    fetch(token, url, options = {}, reqOptions = {}) {
        const emit = reqOptions.emit || noop;
        const tp =
            'token' in reqOptions
                ? Promise.resolve(reqOptions.token)
                : token.get();

        return tp.then((tok) => {
            emit({ name: 'token:get', data: tok });

            //add to query string or add query string.
            //if the given url is full (e.g. starts http), don't use our endpoint.
            //otherwise do.
            const finalUrl =
                url.indexOf('http') === 0 ? url : this.endpoint + url;

            options.headers = {
                ...(options.headers || {}),
                ...(reqOptions.headers || {}),
                Authorization: 'Bearer ' + tok,
            };

            const t = timer();
            const fetchPromise = fetch(finalUrl, options);

            if (options.raw === true) {
                return fetchPromise;
            }

            return fetchPromise.then((res) => {
                emit({
                    name: 'http:fetch-header',
                    data: { status: res.status, time: t() },
                });

                let op = Promise.resolve({});

                if (res.status !== 204) {
                    //we are expecting content as json
                    op = res.json().catch(() => {
                        if (res.status === 202) {
                            // Special case when there is potentially no body
                            return {};
                        }

                        res.status = 502; // pretend bad status from upstream

                        return {
                            error: 'Invalid JSON in response from GraphIT',
                        };
                    });
                }

                return op.then((object) => {
                    emit({
                        name: 'http:fetch-body',
                        data: { time: t(), body: object },
                    });

                    //check for error.
                    if ('error' in object) {
                        let errorMessage = 'Unknown GraphIT Error';

                        if (typeof object.error === 'string') {
                            errorMessage = object.error;
                        } else if (
                            typeof object.error === 'object' &&
                            typeof object.error.message === 'string'
                        ) {
                            errorMessage = object.error.message;
                        }

                        const error = createError(
                            res.status,
                            '[HTTP] Error: ' + errorMessage,
                        );

                        //the "connection" decides what to do with each error.
                        throw error;
                    }

                    //what to do here, if "items" in object, then we return items, other
                    //things return plain graphit nodes (which CANNOT have items as a key - they need a slash).
                    if ('items' in object) {
                        return object.items;
                    }

                    //assume it is the object we want.
                    return object;
                });
            });
        });
    }

    //request has to translate the base request objects to fetch.
    request(token, { type, headers = {}, body = {} } = {}, reqOptions = {}) {
        const [url, options] = createFetchOptions({ type, headers, body });

        return this.fetch(token, url, options, reqOptions);
    }

    defaultOptions() {
        return defaultFetchOptions();
    }
}

//exported for use in the connection
export const defaultFetchOptions = () => ({
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    mode: 'cors',
});

//here are the mappings to fetch options from the websocket payloads.
function createFetchOptions({ type, headers = {}, body = {} } = {}) {
    let url;
    const options = defaultFetchOptions();

    switch (type) {
        case 'getme':
            url = `${AUTH_API_BASE}/me/account?profile=true`;
            break;
        case 'get':
            url = `${GRAPH_API_BASE}/${encodeURIComponent(
                headers['ogit/_id'],
            )}`;
            break;
        case 'create':
            url =
                `${GRAPH_API_BASE}/new/` +
                encodeURIComponent(headers['ogit/_type']) +
                qsKeys(headers, 'waitForIndex');
            sendJSON(options, body);
            break;
        case 'update':
            url =
                `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}` +
                qsKeys(headers, 'waitForIndex');
            sendJSON(options, body);
            break;
        case 'replace':
            const t = headers.createIfNotExists
                ? headers['ogit/_type']
                : undefined;
            const obj = Object.assign({ 'ogit/_type': t }, headers);

            url =
                `${GRAPH_API_BASE}/${encodeURIComponent(headers['ogit/_id'])}` +
                qsKeys(obj, 'createIfNotExists', 'ogit/_type', 'waitForIndex');
            sendJSON(options, body, 'PUT');
            break;
        case 'delete':
            url = `${GRAPH_API_BASE}/${encodeURIComponent(
                headers['ogit/_id'],
            )}`;
            options.method = 'DELETE';
            break;
        case 'connect':
            url = `${GRAPH_API_BASE}/connect/${encodeURIComponent(
                headers['ogit/_type'],
            )}`;
            sendJSON(options, body);
            break;
        case 'query':
            url = `${GRAPH_API_BASE}/query/` + headers.type;
            sendJSON(options, body);
            break;
        case 'streamts':
            url =
                `${GRAPH_API_BASE}/` +
                encodeURIComponent(headers['ogit/_id']) +
                '/values' +
                qsKeys(
                    headers,
                    'offset',
                    'limit',
                    'from',
                    'to',
                    'includeDeleted',
                    'with',
                );
            break;
        case 'writets':
            url =
                `${GRAPH_API_BASE}/` +
                encodeURIComponent(headers['ogit/_id']) +
                '/values';
            sendJSON(options, body);
            break;
        case 'history':
            url =
                `${GRAPH_API_BASE}/` +
                encodeURIComponent(headers['ogit/_id']) +
                '/history' +
                qsKeys(
                    headers,
                    'offset',
                    'limit',
                    'from',
                    'to',
                    'version',
                    'type',
                    'includeDeleted',
                    'listMeta',
                    'vid',
                );
            break;
        case 'meta':
            url =
                `${GRAPH_API_BASE}/` +
                encodeURIComponent(headers['ogit/_id']) +
                '/meta';
            break;
        default:
            throw new Error(`[HTTP] Unknown API call: ${type}`);
    }

    return [url, options];
}

function qsKeys(obj = {}, ...keys) {
    const qs = keys
        .map((k) => {
            if (k in obj && obj[k] !== undefined) {
                return `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`;
            }

            return false;
        })
        .filter(Boolean)
        .join('&');

    return qs.length ? '?' + qs : '';
}

function sendJSON(options, body, method = 'POST') {
    options.method = method;
    options.body = JSON.stringify(body);

    return options;
}
