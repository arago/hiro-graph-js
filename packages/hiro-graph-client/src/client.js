/**
 *  A GraphIT Client
 *
 *  It will use Websockets where possible and fall back to HTTP where WebSockets not supported.
 *  Event streams require WebSockets so those will not work witout websocket support.
 *  The connection requires a `Token`.
 */
import WebsocketTransport, {
    webSocketsAvailable,
} from './transport-websocket-pool';
import HttpTransport from './transport-http';
import {
    isUnauthorized,
    isTransactionFail,
    isConflict,
    isNotFound,
    connectionClosedBeforeSend,
} from './errors';
import { fixedToken } from './token';
import EventStream from './eventstream';
import subscriberFanout from './subscriber-fanout';
import timer from './timer';

const passthru = (fn) => [
    (r) => (fn(), r),
    (e) => {
        fn();
        throw e;
    },
];

//nb this isn't a deep clone, just a top level deref.
//we only deal with primitives, arrays and plain objects.
const dereference = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.slice();
    }

    return Object.assign({}, obj);
};

export default class Client {
    constructor({ endpoint, token }, transportOptions = {}) {
        this.endpoint = endpoint;

        //we hold on to the token for ease of access/manual invalidation
        this.token = typeof token === 'string' ? fixedToken(token) : token;

        //create the transports.
        //the http is for http only endpoint, e.g. the /_ki/* and /_variable/* servlets
        this.http = new HttpTransport(endpoint);

        // This is the main transport for most of the api.
        // Use Websocket if available (except if specifically disabled)
        // fallback to http, or use given transport
        // duck type the final parameter
        if (typeof transportOptions.request === 'function') {
            this.transport = transportOptions;
        } else if (webSocketsAvailable && !transportOptions.forceHTTP) {
            //All a transport needs to implement is "request"
            this.transport = new WebsocketTransport(endpoint, transportOptions);
        } else {
            if (!webSocketsAvailable) {
                console.warn(
                    'WebSockets not available, falling back to HTTP transport',
                );
            }

            this.transport = this.http;
        }

        // Bind our fetch for extension servlets.
        this.fetch = (...args) => this.http.fetch(this.token, ...args);
        this.proxyFetch = (proxy) => (url, ...args) =>
            this.fetch(`${proxy}${url}`, ...args);

        this._dedup = Object.create(null);

        //keep this so we can duplicate them
        this._servlets = [];

        this._pubsub = subscriberFanout();
    }

    // NB this is not held anywhere in this instance, but returned
    // to the caller. It only connects when it's subscribe() method
    // is called.
    eventStream(filters = [], { groupId, offset } = {}) {
        let filtersArray = filters;

        if (!Array.isArray(filters)) {
            filtersArray = [filters];
        }

        if (filtersArray.some((f) => typeof f !== 'string')) {
            throw new Error(
                'All filters must be strings representing `jfilter` filters',
            );
        }

        if (filtersArray.length === 0) {
            // add a default one that catches everything
            filtersArray.push('(element.ogit/_id = *)');
        }

        return new EventStream(
            { endpoint: this.endpoint, token: this.token },
            { groupId, offset, filters: filtersArray },
            this._pubsub.fanout,
        );
    }

    /**
     *  Could be useful for more than just logging, all events emitted
     *  have { name: "<event name>", data: <any> }
     */
    introspect(fn) {
        return this._pubsub.subscribe(fn);
    }

    /**
     *  Make a clone of this connection, but with new
     */
    cloneWithNewToken(newToken) {
        const cloned = new Client(
            {
                endpoint: this.endpoint,
                token: newToken,
            },
            this.transport,
        );

        this._servlets.forEach(([name, methods]) =>
            cloned.addServlet(name, methods),
        );

        return cloned;
    }

    /**
     *  Make a generic request. The transport will handle the details, we handle the retry.
     *  We use `this.transport` which is websocket if available.
     */
    request(
        { type, headers = {}, body = {} } = {},
        reqOptions = {},
        retries = 1,
    ) {
        this._pubsub.fanout({
            name: 'client:pre-request',
            data: { type, headers, body },
        });

        return this.transport
            .request(
                this.token,
                { type, headers, body },
                Object.assign({ debug: this._debug_requests }, reqOptions, {
                    emit: this._pubsub.fanout,
                }),
            )
            .catch((err) => {
                this._pubsub.fanout({ name: 'client:error', data: err });

                //these are the special cases.
                //regular errors end up with code === undefined, so not retryable.
                switch (true) {
                    case err === connectionClosedBeforeSend:
                        //this means unconditionally retry
                        return this.request(
                            { type, headers, body },
                            reqOptions,
                            retries,
                        );
                    case isUnauthorized(err): //unauthorized (which means unauthenticated) invalidate TOKEN.
                        this.token.invalidate();
                        this._pubsub.fanout({
                            name: 'client:unauthorized',
                            data: null,
                        });
                        err.isRetryable = true;
                        break;
                    case isTransactionFail(err): //error persisting transaction. retryable.
                        err.isRetryable = true;
                        break;
                    //there are other known errors, e.g. 403, 400, etc... but they are not retryable.
                    default:
                        if ('isRetryable' in err === false) {
                            err.isRetryable = false;
                        }

                        break;
                }

                //a chance to retry
                if (err.isRetryable && retries > 0) {
                    this._pubsub.fanout({
                        name: 'client:retry',
                        data: { type, headers, body },
                    });

                    return this.request(
                        { type, headers, body },
                        reqOptions,
                        retries - 1,
                    );
                }

                throw err;
            });
    }

    // Deduplicates a request, but the request must be an Array returning one.
    dedupedRequest(
        { type, headers = {}, body = {} } = {},
        reqOptions = {},
        retries = 1,
    ) {
        try {
            const requestKey = JSON.stringify({ type, headers, body });

            this._pubsub.fanout({
                name: 'client:deduping',
                data: {
                    key: requestKey,
                    calls: this._dedup[requestKey]
                        ? this._dedup[requestKey]._calls
                        : 0,
                },
            });

            if (requestKey in this._dedup) {
                this._dedup[requestKey]._calls++;

                return this._dedup[requestKey].then(dereference);
            }

            const cleanUp = passthru(() => {
                const calls = this._dedup[requestKey]._calls;

                this._pubsub.fanout({
                    name: 'client:deduped',
                    data: { key: requestKey, calls },
                });
                delete this._dedup[requestKey];
            });
            const promise = (this._dedup[requestKey] = this.request(
                { type, headers, body },
                reqOptions,
                retries,
            )
                .then(...cleanUp)
                .then((res) => (promise._calls > 1 ? dereference(res) : res)));

            promise._calls = 1;

            return promise;
        } catch (e) {
            this._pubsub.fanout({
                name: 'client:dedup-error',
                data: e,
            });

            return Promise.reject(e);
        }
    }

    getToken() {
        return this.token;
    }

    // helper to get debug info...
    wrapTimedEvent(event, args, promise) {
        const t = timer();

        return promise.then(
            ...passthru(() =>
                this._pubsub.fanout({
                    name: 'client:' + event,
                    data: { time: t(), args },
                }),
            ),
        );
    }

    /**
     *  Core GraphIT REST API methods
     *  Prefer websocket transport
     *  The servlets for e.g. /_ki/validate are added using mixins
     */

    /**
     *  GraphIT Server Info
     *  Info is an HTTP only endpoint, and an un-authenticated one.
     */
    info(reqOptions = {}) {
        return this.wrapTimedEvent(
            'info',
            {},
            this.http.request(
                null, // no token here
                { type: 'info' },
                { token: false, ...reqOptions }, //no token here
            ),
        );
    }

    /**
     *  Get a single item by ID
     */
    get(id = '_me', reqOptions = {}) {
        if (id === '_me') {
            return this.me(reqOptions);
        }

        const headers = { 'ogit/_id': id };

        if (reqOptions.listMeta) {
            headers.listMeta = true;
        }

        return this.wrapTimedEvent(
            'get',
            { id },
            this.dedupedRequest({ type: 'get', headers }, reqOptions),
        );
    }

    /**
     *  Get the node for the owner of this token
     */
    me(reqOptions = {}) {
        return this.wrapTimedEvent(
            'me',
            {},
            this.dedupedRequest({ type: 'me' }, reqOptions),
        );
    }

    /**
     *  Create a new node
     */
    create(type, data = {}, reqOptions = {}) {
        const headers = { 'ogit/_type': type };

        if (reqOptions.waitForIndex) {
            headers.waitForIndex = 'true';
        }

        return this.wrapTimedEvent(
            'create',
            { data },
            this.request({ type: 'create', headers, body: data }, reqOptions),
        );
    }

    /**
     *  Update a Node
     */
    update(id, data = {}, reqOptions = {}) {
        const headers = { 'ogit/_id': id };

        if (reqOptions.waitForIndex) {
            headers.waitForIndex = 'true';
        }

        return this.wrapTimedEvent(
            'update',
            { id, data },
            this.request({ type: 'update', headers, body: data }, reqOptions),
        );
    }

    /**
     *  Replace a Node, optionally `upsert`
     */
    replace(id, data = {}, reqOptions = {}) {
        const { createIfNotExists = false, waitForIndex = false } = reqOptions;
        //createIfNotExists should contain the "ogit/_type" to create if the node doesn't exist,
        //and nothing otherwise
        const headers = { 'ogit/_id': id };

        if (createIfNotExists) {
            Object.assign(headers, {
                createIfNotExists: 'true',
                'ogit/_type': createIfNotExists,
            });
        }

        if (waitForIndex) {
            headers.waitForIndex = 'true';
        }

        return this.wrapTimedEvent(
            'replace',
            { id, data },
            this.request({ type: 'replace', headers, body: data }, reqOptions),
        );
    }

    /**
     *  Delete a node/edge
     *
     *  We don't handle the 404/409 here. or should we?
     */
    delete(id, reqOptions = {}) {
        const { waitForIndex = false } = reqOptions;
        const headers = { 'ogit/_id': id };

        if (waitForIndex) {
            headers.waitForIndex = 'true';
        }

        return this.wrapTimedEvent(
            'delete',
            { id },
            this.request({ type: 'delete', headers }, reqOptions),
        );
    }

    /**
     *  This is a vertices query
     */
    lucene(
        query = '',
        {
            limit = 50,
            offset = 0,
            order = false,
            fields = [],
            count = false,
            ...placeholders
        } = {},
        reqOptions = {},
    ) {
        const body = {
            query,
            limit,
            offset,
            ...placeholders,
        };

        if (count) {
            body.count = 'true'; // string true
        }

        if (order) {
            body.order = '' + order; // this implicitly does array.join(",") for arrays. (and works with strings...)
        }

        if (fields.length > 0) {
            body.fields = Array.isArray(fields)
                ? fields.join(',')
                : String(fields);
        }

        return this.wrapTimedEvent(
            'lucene',
            body,
            this.dedupedRequest(
                {
                    type: 'query',
                    headers: { type: 'vertices' },
                    body,
                },
                reqOptions,
            ),
        );
    }

    ids(list, reqOptions = {}) {
        return this.wrapTimedEvent(
            'ids',
            { ids: list },
            this.dedupedRequest(
                {
                    type: 'query',
                    headers: { type: 'ids' },
                    body: { query: list.join(',') }, // yes, it has to be a comma-seperated string
                },
                reqOptions,
            ),
        );
    }

    /**
     *  This is a gremlin query
     */
    gremlin(root, query, reqOptions = {}) {
        return this.wrapTimedEvent(
            'gremlin',
            { root, query: '' + query },
            this.dedupedRequest(
                {
                    type: 'query',
                    headers: { type: 'gremlin' },
                    body: { root, query },
                },
                reqOptions,
            ),
        );
    }

    /**
     *  Connect two Nodes with an edge of `type`
     */
    connect(type, inId, outId, reqOptions = {}) {
        return this.wrapTimedEvent(
            'connect',
            { verb: type, in: inId, out: outId },
            this.request(
                {
                    type: 'connect',
                    headers: { 'ogit/_type': type },
                    body: { in: inId, out: outId },
                },
                reqOptions,
            ).then(
                () => {}, //return nothing.
                (err) => {
                    //Conflict is OK here, just means that the edge was already connected.
                    if (isConflict(err)) {
                        return; //return nothing.
                    }

                    //real error.
                    throw err;
                },
            ),
        );
    }

    /**
     *  Disconnect two nodes, convenience for delete, generates the edge id for you.
     */
    disconnect(type, inId, outId, reqOptions = {}) {
        return this.wrapTimedEvent(
            'disconnect',
            { verb: type, in: inId, out: outId },
            this.delete(`${outId}$$${type}$$${inId}`, reqOptions).then(
                () => {}, //return nothing.
                (err) => {
                    //Not Found or Conflict is OK here, just means that the edge was already deleted/didn't ever exist
                    if (isNotFound(err) || isConflict(err)) {
                        return; //return nothing.
                    }

                    //real error.
                    throw err;
                },
            ),
        );
    }

    /**
     *  Write timeseries values (only ogit/Timeseries vertices)
     *
     *  values are { timestamp: millisecond unix, value: string value }
     */
    writets(timeseriesId, values) {
        let items = values;

        if (!Array.isArray(values)) {
            items = [values];
        }

        return this.wrapTimedEvent(
            'writets',
            { id: timeseriesId, items },
            this.request({
                type: 'writets',
                headers: {
                    'ogit/_id': timeseriesId,
                },
                body: { items },
            }),
        );
    }

    /**
     *  Read timeseries values (only ogit/Timeseries vertices)
     */
    streamts(timeseriesId, { from = false, to = false, limit = 50 } = {}) {
        const headers = {
            'ogit/_id': timeseriesId,
        };
        const body = {};

        if (from !== false) {
            body.from = from.toString();
        }

        if (to !== false) {
            body.to = to.toString();
        }

        if (limit !== false) {
            body.limit = limit.toString();
        }

        return this.wrapTimedEvent(
            'streamts',
            {
                id: timeseriesId,
                from: from.toString(),
                to: to.toString(),
                limit: limit.toString(),
            },
            this.dedupedRequest({
                type: 'streamts',
                headers,
                body,
            }),
        );
    }

    /**
     * Placeholders here for reading/writing log files (ogit/Log)
     */
    //eslint-disable-next-line no-unused-vars
    writelog(logId, entries) {
        return Promise.reject(new Error('Log writing is not implemented yet'));
    }
    //eslint-disable-next-line no-unused-vars
    readlog(logId, options) {
        return Promise.reject(new Error('Log reading is not implemented yet'));
    }

    /**
     *  Returns previous versions of a vertex
     */
    history(
        id,
        {
            offset = false,
            limit = false,
            from = false,
            to = false,
            version = false,
            type = false,
        } = {},
    ) {
        const headers = { 'ogit/_id': id };
        const body = {};

        if (offset !== false) {
            body.offset = offset;
        }

        if (limit !== false) {
            body.limit = limit;
        }

        if (from !== false) {
            body.from = from;
        }

        if (to !== false) {
            body.to = to;
        }

        if (version !== false) {
            body.version = version;
        }

        if (type !== false) {
            body.type = type;
        }

        return this.wrapTimedEvent(
            'history',
            { id, ...body },
            this.dedupedRequest({
                type: 'history',
                headers: headers,
                body,
            }),
        );
    }

    /**
     *  Custom servlet endpoints
     *  always use HTTP transport, which knows how to handle these types.
     *
     *  The servletMethods are passed:
     *  - `fetch` a token/endpoint aware HTTP fetch API.
     *  - `options` the default fetch options you can override
     *  - `...args` the rest of the args passed in by the user for that method
     */
    addServlet(prefix, servletMethods, proxy) {
        if (!prefix) {
            throw new Error('[GRAPH] Must give prefix for servlet');
        }

        if (prefix in this) {
            throw new Error(
                '[GRAPH] Sevlet Extensions must have unique prefixes. Attempted to re-add `' +
                    prefix +
                    '`',
            );
        }

        const fetch = proxy ? this.proxyFetch(proxy) : this.fetch;

        //create namespace.
        this[prefix] = {};
        //add servlet methods
        Object.keys(servletMethods).reduce((acc, method) => {
            acc[method] = (...args) => {
                const call = servletMethods[method];

                return this.wrapTimedEvent(
                    'servlet-' + method,
                    { args },
                    call(fetch, this.http.defaultOptions(), ...args).catch(
                        (err) => {
                            //these are the special cases.
                            //regular errors end up with code === undefined, so not retryable.
                            switch (true) {
                                case isUnauthorized(err): //unauthorized (which means unauthenticated) invalidate TOKEN.
                                    this.token.invalidate();
                                    err.isRetryable = true;
                                    break;
                                case isTransactionFail(err): //error persisting transaction. retryable.
                                    err.isRetryable = true;
                                    break;
                                //there are other known errors, e.g. 403, 400, etc... but they are not retryable.
                                default:
                                    if ('isRetryable' in err === false) {
                                        err.isRetryable = false;
                                    }

                                    break;
                            }

                            //a chance to retry - only once.
                            if (err.isRetryable) {
                                return servletMethods[method](
                                    fetch,
                                    this.http.defaultOptions(),
                                    ...args,
                                );
                            }

                            throw err;
                        },
                    ),
                );
            };

            return acc;
        }, this[prefix]);

        //chainable? might be useful.
        return this;
    }
}
