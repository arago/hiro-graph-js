/**
 *  Websocket Transport for the GraphIT REST API.
 */
import { w3cwebsocket as WS } from 'websocket';

import { create as createError, connectionClosedBeforeSend } from './errors';
import timer from './timer';
import { GRAPH_WS_API_BASE } from './api-version';

const noop = () => {};

export const webSocketsAvailable = WS !== undefined && WS !== null;

// throw if websockets NOT available
export const ensureWebSocketsAvailable = () => {
    if (!webSocketsAvailable) {
        throw new Error('WebSockets are not available');
    }
};

// The graph websocket api accepts a protocol
export const GRAPH_API_PROTOCOL = 'graph-2.0.0';

export default class WebSocketTransport {
    constructor(endpoint) {
        ensureWebSocketsAvailable();
        this.endpoint = endpoint
            .replace(/^http/, 'ws') //replace http(s) with ws(s)
            .replace(/\/?$/, `${GRAPH_WS_API_BASE}/`); // replace possible trailing slash with api endpoint
    }

    /**
     *  Make a request. Most of the work is done by the connect function.
     */
    request(token, { type, headers = {}, body = {} }, reqOptions = {}) {
        //the connect call ensures the websocket is connected before continuing.
        return this.connect(token, reqOptions.emit).then((client) =>
            client.send(
                token,
                {
                    type,
                    headers: {
                        ...headers,
                        ...(reqOptions.headers || {}),
                    },
                    body,
                },
                reqOptions,
            ),
        );
    }

    /**
     *  Return a promise for the connected websocket.
     */
    connect(token, emit = noop) {
        if (!this.__connectionPromise) {
            this.__connectionPromise = this.createWebSocket(token, emit);
        }

        return this.__connectionPromise;
    }

    /**
     *  Creates a WebSocket connection, with the initial token.
     */
    createWebSocket(initialToken, emit) {
        if (!initialToken) {
            throw new Error('createWebSocket received no initial token!');
        }

        //we do all this in a promise, so the result is shared between
        //all requests that come in during connection.
        const t = timer({ laps: false }); // always since beginning timer

        return initialToken.get().then((initialTok) => {
            emit({ name: 'token:get', data: { token: initialTok, time: t() } });

            return new Promise((resolve, reject) => {
                //always try for the newer protocol. The older one is forwards compatible so
                //we don't really care if we get the old one.
                const ws = new WS(this.endpoint, [
                    GRAPH_API_PROTOCOL,
                    `token-${initialTok}`,
                ]);

                //this is for our inflight messages
                const inflight = new Map();

                //this keeps track of whether we have resolved yet.
                let hasResolved = false;

                //this generates IDs for us, wrapping eventually
                let _id = 0;
                const nextId = () => {
                    const n = _id++;

                    if (_id > 1e9) {
                        //this has got big. let's reset.
                        _id = 0;
                    }

                    return '' + n; //needs to be a string.
                };

                //in the server side implementation these are important
                let refCount = 0;
                const ref = () => {
                    if (++refCount && ws._connection && ws._connection.socket) {
                        ws._connection.socket.ref();
                        emit({ name: 'ws:ref', data: refCount });
                    }
                };
                const unref = () => {
                    if (
                        --refCount === 0 &&
                        ws._connection &&
                        ws._connection.socket
                    ) {
                        ws._connection.socket.unref();
                        emit({ name: 'ws:unref', data: null });
                    }
                };

                //when the connection closes we need to tidy up.
                ws.onclose = () => {
                    emit({ name: 'ws:close', data: t() }); // give how long it was open as data
                    //most importantly, remove this promise. so a new one can be created.
                    this.__connectionPromise = null;

                    //clean any inflight messages, they need to FAIL, but in a retryable way.
                    const error = createError(500, '[REST] WebSocket Closed');

                    error.isRetryable = true;
                    inflight.forEach(({ callback }) => callback(error));
                    inflight.clear();

                    //if we haven't resolved yet, then this is an *immediate* close by GraphIT.
                    //therefore we probably have an invalid token, and we should definitely reject.
                    if (!hasResolved) {
                        hasResolved = true;
                        initialToken.invalidate();
                        emit({ name: 'ws:invalidate', data: null });
                        reject(error);
                    }
                };

                //on connection error, we almost certainly close after this anyway, so just
                //log the error
                ws.onerror = (err) => {
                    emit({ name: 'ws:error', data: err });
                };

                //how to handle inbound messages, find the inflight it matches and return
                ws.onmessage = (msg) => {
                    //we can only handle string messages
                    if (typeof msg.data !== 'string') {
                        //we don't handle messages like this.
                        emit({ name: 'ws:bad-message', data: msg.data });

                        return;
                    }

                    //try and parse as JSON
                    let object;

                    try {
                        object = JSON.parse(msg.data);
                    } catch (e) {
                        emit({ name: 'ws:bad-message', data: msg.data });

                        return;
                    }

                    //ok, we should now have an ID we can use.
                    const id = object.id;
                    const handle = inflight.get(id);

                    if (!handle) {
                        emit({ name: 'ws:unknown', data: id });

                        return;
                    }

                    const hasSub =
                        handle.sub && typeof handle.sub.next === 'function';

                    // check for error response.
                    if (object.error) {
                        emit({
                            name: 'ws:message-error',
                            data: { id, error: object.error },
                        });
                        //remove object from inflight immediately.
                        inflight.delete(id);

                        //this is an error message, but it may be more than that.
                        const error = createError(
                            object.error.code,
                            object.error.message ||
                                '[REST] Unknown GraphIT Error',
                        );

                        return handle.callback(error);
                    }

                    const body = object.body;

                    if (!object.multi) {
                        emit({ name: 'ws:single', data: { id } });

                        if (hasSub) {
                            handle.sub.next(body);
                        }

                        //This is a single packet response.
                        handle.callback(null, body);
                        inflight.delete(id);

                        return; //or we'll double callback and breqak the refs
                    }

                    //if this is a partial, add data to the inflight request.
                    if (!handle.result) {
                        handle.result = [];
                    }

                    // this case is when no results at all are found for a query.
                    // NB, all real response bodies are `truthy` (even empty array and empty object)
                    // so if this is `falsy` then we didn't get a result. In the new protocol, that
                    // happens in a "multi" response when there where no hits.
                    // NOPE! we can have gremlin/count results with a single numeric/string value
                    // so we check those too
                    if (body || body === 0 || body === '') {
                        handle.result.push(body);
                    }

                    if (object.more === true) {
                        emit({
                            name: 'ws:more',
                            data: { id, count: handle.result.length },
                        });

                        if (hasSub) {
                            handle.sub.next(body);
                        }

                        return;
                    }

                    //final response
                    //remove object from inflight immediately.
                    inflight.delete(id);
                    //ok, we should have an array in handle.result
                    emit({
                        name: 'ws:multi',
                        data: { id, count: handle.result.length },
                    });

                    if (hasSub) {
                        handle.sub.next(body);
                    }

                    handle.callback(null, handle.result);
                };

                //now the socket is opened we can resolve our promise with a client API
                ws.onopen = () => {
                    emit({
                        name: 'ws:open',
                        data: { time: t(), protocol: ws.protocol },
                    });
                    this.protocol = ws.protocol;

                    if (ws.protocol !== GRAPH_API_PROTOCOL) {
                        throw Object.assign(
                            new Error(
                                `Expecting Graph API SubProtocol: '${GRAPH_API_PROTOCOL}', got: '${ws.protocol}'`,
                            ),
                            {
                                protocolError: {
                                    expected: GRAPH_API_PROTOCOL,
                                    actual: ws.protocol,
                                },
                            },
                        );
                    }

                    //actually if we send a bad token, we need to wait for a moment before resolving.
                    //otherwise, the connection will shut straightaway.
                    //testing shows this usually takes about 10ms, but the largest time I saw was
                    //32ms. We use 100ms just in case. This makes the initial connection slower, but
                    //is a one off cost.
                    setTimeout(() => {
                        if (hasResolved) {
                            //crap, we did fail.
                            return;
                        }

                        //now mark this as resolving so we don't invalidate our token accidentally.
                        hasResolved = true;
                        emit({ name: 'ws:connected', data: { time: t() } });
                        resolve({
                            //this is how we initiate a send and create the callback.
                            send: (
                                token,
                                { type, headers, body },
                                {
                                    sub = {
                                        next: noop,
                                        error: noop,
                                        complete: noop,
                                    },
                                },
                            ) => {
                                //first we get the new Token.
                                const reqtimer = timer();

                                return token.get().then((tok) => {
                                    emit({
                                        name: 'token:get',
                                        data: { token: tok, time: reqtimer() },
                                    });

                                    const id = nextId();
                                    const payload = JSON.stringify({
                                        _TOKEN: tok,
                                        id,
                                        type,
                                        headers,
                                        body,
                                    });

                                    return new Promise((_resolve, _reject) => {
                                        if (ws.readyState !== WS.OPEN) {
                                            //we may have closed whilst waiting for the token.
                                            //always retry.
                                            emit({
                                                name: 'ws:close-before-send',
                                                data: null,
                                            });

                                            return connectionClosedBeforeSend;
                                        }

                                        ref();

                                        let called = false;
                                        const callback = (err, data) => {
                                            if (called) {
                                                return;
                                            }

                                            if (err) {
                                                sub.error(err);
                                            } else {
                                                sub.complete();
                                            }

                                            called = true;
                                            unref();
                                            emit({
                                                name: 'ws:complete',
                                                data: {
                                                    ok: Boolean(err),
                                                    time: reqtimer(),
                                                    data: err ? err : data,
                                                },
                                            });

                                            return err
                                                ? _reject(err)
                                                : _resolve(data);
                                        };

                                        //create a callback for the inflight requests.
                                        inflight.set(id, { callback, sub });
                                        emit({
                                            name: 'ws:send',
                                            data: { payload, time: reqtimer() },
                                        });
                                        //now send the request.
                                        ws.send(payload);
                                    });
                                });
                            },
                        });
                    }, 100);
                };
            });
        });
    }
}

WebSocketTransport.PROTOCOL = GRAPH_API_PROTOCOL;
