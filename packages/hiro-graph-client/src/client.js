/**
 *  A GraphIT Client
 *
 *  It will use Websockets where possible and fall back to HTTP where WebSockets not supported.
 *  Event streams require WebSockets so those will not work witout websocket support.
 *  The connection requires a `Token`.
 */
import WebsocketTransport, {
    webSocketsAvailable
} from "./transport-websocket-pool";
import HttpTransport from "./transport-http";
//import EventTransport from "./eventstream";
import {
    isUnauthorized,
    isTransactionFail,
    isConflict,
    isNotFound,
    connectionClosedBeforeSend
} from "./errors";

const passthru = fn => [
    r => (fn(), r),
    e => {
        fn();
        throw e;
    }
];

//nb this isn't a deep clone, just a top level deref.
//we only deal with primitives, arrays and plain objects.
const dereference = obj => {
    if (typeof obj !== "object" || obj === null) {
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
        this.token = token;

        //create the transports.
        //the http is for http only endpoint, e.g. the /_ki/* and /_variable/* servlets
        this.http = new HttpTransport(endpoint);

        // This is the main transport for most of the api.
        // Use Websocket if available (except if specifically disabled)
        // fallback to http, or use given transport
        // duck type the final parameter
        if (typeof transportOptions.request === "function") {
            this.transport = transportOptions;
        } else if (webSocketsAvailable && !transportOptions.forceHTTP) {
            //All a transport needs to implement is "request"
            this.transport = new WebsocketTransport(endpoint, transportOptions);
        } else {
            if (!webSocketsAvailable) {
                console.warn(
                    "WebSockets not available, falling back to HTTP transport"
                );
            }
            this.transport = this.http;
        }

        // This is where we keep our event streams.
        // NB EventStream is not implemented yet
        this.events = [];

        // Bind our fetch for extension servlets.
        this.fetch = (...args) => this.http.fetch(this.token, ...args);

        this._dedup = Object.create(null);

        //keep this so we can duplicate them
        this._servlets = [];
    }

    debugRequests(turnOnDebugging) {
        this._debug_requests = turnOnDebugging === true;
    }

    /**
     *  Make a clone of this connection, but with new
     */
    cloneWithNewToken(newToken) {
        const cloned = new Client(
            {
                endpoint: this.endpoint,
                token: newToken
            },
            this.transport
        );
        this._servlets.forEach(([name, methods]) =>
            cloned.addServlet(name, methods)
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
        retries = 1
    ) {
        return this.transport
            .request(
                this.token,
                { type, headers, body },
                Object.assign({ debug: this._debug_requests }, reqOptions)
            )
            .catch(err => {
                //these are the special cases.
                //regular errors end up with code === undefined, so not retryable.
                switch (true) {
                    case err === connectionClosedBeforeSend:
                        //this means unconditionally retry
                        return this.request(
                            { type, headers, body },
                            reqOptions,
                            retries
                        );
                    case isUnauthorized(err): //unauthorized (which means unauthenticated) invalidate TOKEN.
                        this.token.invalidate();
                        err.isRetryable = true;
                        break;
                    case isTransactionFail(err): //error persisting transaction. retryable.
                        err.isRetryable = true;
                        break;
                    //there are other known errors, e.g. 403, 400, etc... but they are not retryable.
                    default:
                        if ("isRetryable" in err === false) {
                            err.isRetryable = false;
                        }
                        break;
                }
                //a chance to retry
                if (err.isRetryable && retries > 0) {
                    return this.request(
                        { type, headers, body },
                        reqOptions,
                        retries - 1
                    );
                }
                throw err;
            });
    }

    // Deduplicates a request, but the request must be an Array returning one.
    dedupedRequest(
        { type, headers = {}, body = {} } = {},
        reqOptions = {},
        retries = 1
    ) {
        // isDebug is either set in requestion options, or if not, it is inherited from `this`
        const isDebug = "debug" in reqOptions
            ? reqOptions.debug
            : this._debug_requests;
        try {
            const requestKey = JSON.stringify({ type, headers, body });
            if (isDebug) {
                console.info(
                    "deduped request, key:",
                    requestKey,
                    "isDupe?",
                    requestKey in this._dedup
                );
            }
            if (requestKey in this._dedup) {
                this._dedup[requestKey]._calls++;
                return this._dedup[requestKey].then(dereference);
            }
            const cleanUp = passthru(() => {
                if (isDebug) {
                    const calls = this._dedup[requestKey]._calls;
                    if (calls > 1) {
                        console.info("Depuped Request (%dx)", calls, {
                            type,
                            headers,
                            body
                        });
                    }
                }
                delete this._dedup[requestKey];
            });
            const promise = (this._dedup[requestKey] = this.request(
                { type, headers, body },
                reqOptions,
                retries
            )
                .then(...cleanUp)
                .then(res => (promise._calls > 1 ? dereference(res) : res)));
            promise._calls = 1;
            return promise;
        } catch (e) {
            console.error("dedup error", e.stack);
            return Promise.reject(e);
        }
    }

    getToken() {
        return this.token;
    }

    /**
     *  Core GraphIT REST API methods
     *  Prefer websocket transport
     *  The servlets for e.g. /_ki/validate are added using mixins
     */

    /**
     *  GraphIT Server Info
     */
    info(reqOptions = {}) {
        return this.request({ type: "info" }, reqOptions);
    }

    /**
     *  Get a single item by ID
     */
    get(id = "_me", reqOptions = {}) {
        if (id === "_me") {
            return this.me(reqOptions);
        }
        return this.dedupedRequest(
            { type: "get", headers: { "ogit/_id": id } },
            reqOptions
        );
    }

    /**
     *  Get the node for the owner of this token
     */
    me(reqOptions = {}) {
        return this.dedupedRequest({ type: "me" }, reqOptions);
    }

    /**
     *  Create a new node
     */
    create(type, data = {}, reqOptions = {}) {
        const headers = { "ogit/_type": type };
        if (reqOptions.waitForIndex) {
            headers.waitForIndex = "true";
        }
        return this.request(
            { type: "create", headers, body: data },
            reqOptions
        );
    }

    /**
     *  Update a Node
     */
    update(id, data = {}, reqOptions = {}) {
        const headers = { "ogit/_id": id };
        if (reqOptions.waitForIndex) {
            headers.waitForIndex = "true";
        }
        return this.request(
            { type: "update", headers, body: data },
            reqOptions
        );
    }

    /**
     *  Replace a Node, optionally `upsert`
     */
    replace(id, data = {}, reqOptions = {}) {
        const { createIfNotExists = false, waitForIndex = false } = reqOptions;
        //createIfNotExists should contain the "ogit/_type" to create if the node doesn't exist,
        //and nothing otherwise
        const headers = { "ogit/_id": id };
        if (createIfNotExists) {
            Object.assign(headers, {
                createIfNotExists: "true",
                "ogit/_type": createIfNotExists
            });
        }
        if (waitForIndex) {
            headers.waitForIndex = "true";
        }
        return this.request(
            { type: "replace", headers, body: data },
            reqOptions
        );
    }

    /**
     *  Delete a node/edge
     *
     *  We don't handle the 404/409 here. or should we?
     */
    delete(id, reqOptions = {}) {
        const { waitForIndex = false } = reqOptions;
        const headers = { "ogit/_id": id };
        if (waitForIndex) {
            headers.waitForIndex = "true";
        }
        return this.request({ type: "delete", headers }, reqOptions);
    }

    /**
     *  This is a vertices query
     */
    lucene(
        query = "",
        {
            limit = 50,
            offset = 0,
            order = false,
            fields = [],
            count = false,
            ...placeholders
        } = {},
        reqOptions = {}
    ) {
        const body = {
            query,
            limit,
            offset,
            count,
            ...placeholders
        };
        if (order) {
            body.order = "" + order; // this implicitly does array.join(",") for arrays. (and works with strings...)
        }
        if (fields.length > 0) {
            body.fields = fields.join(",");
        }
        return this.dedupedRequest(
            {
                type: "query",
                headers: { type: "vertices" },
                body
            },
            reqOptions
        );
    }

    ids(list, reqOptions = {}) {
        return this.dedupedRequest(
            {
                type: "query",
                headers: { type: "ids" },
                body: { query: list.join(",") } // yes, it has to be a comma-seperated string
            },
            reqOptions
        );
    }

    /**
     *  This is a gremlin query
     */
    gremlin(root, query, reqOptions = {}) {
        if (this._debug_requests) {
            console.log(`GRAPHIT#gremlin(${root}, ${query})`);
        }
        return this.dedupedRequest(
            {
                type: "query",
                headers: { type: "gremlin" },
                body: { root, query }
            },
            reqOptions
        );
    }

    /**
     *  Connect two Nodes with an edge of `type`
     */
    connect(type, inId, outId, reqOptions = {}) {
        return this.request(
            {
                type: "connect",
                headers: { "ogit/_type": type },
                body: { in: inId, out: outId }
            },
            reqOptions
        ).then(
            () => {}, //return nothing.
            err => {
                //Conflict is OK here, just means that the edge was already connected.
                if (isConflict(err)) {
                    return; //return nothing.
                }
                //real error.
                throw err;
            }
        );
    }

    /**
     *  Disconnect two nodes, convenience for delete, generates the edge id for you.
     */
    disconnect(type, inId, outId, reqOptions = {}) {
        return this.delete(`${inId}$$${type}$$${outId}`, reqOptions).then(
            () => {}, //return nothing.
            err => {
                //Not Found or Conflict is OK here, just means that the edge was already deleted/didn't ever exist
                if (isNotFound(err) || isConflict(err)) {
                    return; //return nothing.
                }
                //real error.
                throw err;
            }
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
    addServlet(prefix, servletMethods) {
        if (!prefix) {
            throw new Error("[GRAPH] Must give prefix for servlet");
        }
        if (prefix in this) {
            throw new Error(
                "[GRAPH] Sevlet Extensions must have unique prefixes. Attempted to re-add `" +
                    prefix +
                    "`"
            );
        }
        //create namespace.
        this[prefix] = {};
        //add servlet methods
        Object.keys(servletMethods).reduce((acc, method) => {
            acc[method] = (...args) => {
                const call = servletMethods[method];
                return call(
                    this.fetch,
                    this.http.defaultOptions(),
                    ...args
                ).catch(err => {
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
                            if ("isRetryable" in err === false) {
                                err.isRetryable = false;
                            }
                            break;
                    }
                    //a chance to retry - only once.
                    if (err.isRetryable) {
                        return servletMethods[method](
                            this.fetch,
                            this.http.defaultOptions(),
                            ...args
                        );
                    }
                    throw err;
                });
            };
            return acc;
        }, this[prefix]);
        //chainable? might be useful.
        return this;
    }
}
