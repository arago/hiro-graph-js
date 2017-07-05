/**
 *  Websocket Transport for the GraphIT REST API.
 */
import { create as createError, connectionClosedBeforeSend } from "./errors";
import { w3cwebsocket as WS } from "websocket";
import dump from "./dump";

export const webSocketsAvailable = WS !== undefined && WS !== null;

// throw if websockets NOT available
export const ensureWebSocketsAvailable = () => {
    if (!webSocketsAvailable) {
        throw new Error("WebSockets are not available");
    }
};

if (webSocketsAvailable) {
    // IF my PR hasn't been pulled yet, or we need to update `node-websocket`.
    // https://github.com/theturtle32/WebSocket-Node/pull/282/files
    if ("OPEN" in WS === false) {
        // so we monkey patch. (just so happens the codes are 0,1,2,3 - the array indicies here)
        ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach((prop, i) =>
            Object.defineProperty(WS, prop, { get: () => i })
        );
        console.warn("patching node-websocket with readyState constants...");
    } else if (process.browser) {
        // when this is called, we can relax
        console.warn(
            "node-websocket has now correctly got the readyState constants, please remove this code from `transport-websocket.js`"
        );
    }
}

// The graph websocket api accepts a protocol
const GRAPH_API_PROTOCOL = "graph-2.0.0";

export default class WebSocketTransport {
    constructor(endpoint, { useLegacyProtocol = false } = {}) {
        ensureWebSocketsAvailable();
        this.useLegacyProtocol = useLegacyProtocol;
        this.endpoint = endpoint
            .replace(/^http/, "ws") //replace http(s) with ws(s)
            .replace(/\/?$/, "/_g/?_TOKEN="); // replace possible trailing slash with api endpoint
    }

    /**
     *  Make a request. Most of the work is done by the connect function.
     */
    request(token, { type, headers = {}, body = {} }, reqOptions = {}) {
        //the connect call ensures the websocket is connected before continuing.
        return this.connect(token).then(client =>
            client.send(token, { type, headers, body }, reqOptions)
        );
    }

    /**
     *  Return a promise for the connected websocket.
     */
    connect(token) {
        if (!this.__connectionPromise) {
            this.__connectionPromise = this.createWebSocket(token);
        }
        return this.__connectionPromise;
    }

    /**
     *  Creates a WebSocket connection, with the initial token.
     */
    createWebSocket(initialToken) {
        if (!initialToken) {
            throw new Error("createWebSocket received no initial token!");
        }
        //we do all this in a promise, so the result is shared between
        //all requests that come in during connection.
        return initialToken.get().then(initialTok => {
            return new Promise((resolve, reject) => {
                //always try for the newer protocol. The older one is forwards compatible so
                //we don't really care if we get the old one.
                const ws = new WS(
                    this.endpoint + initialTok,
                    this.useLegacyProtocol ? undefined : GRAPH_API_PROTOCOL // we have to pass `undefined` explicitly to indicate no protocol specified
                );

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
                    return "" + n; //needs to be a string.
                };

                //in the server side implementation these are important
                let refCount = 0;
                const ref = () => {
                    if (refCount++ && ws._connection && ws._connection.socket) {
                        ws._connection.socket.ref();
                    }
                };
                const unref = () => {
                    if (
                        --refCount === 0 &&
                        ws._connection &&
                        ws._connection.socket
                    ) {
                        ws._connection.socket.unref();
                    }
                };

                //when the connection closes we need to tidy up.
                ws.onclose = () => {
                    //most importantly, remove this promise. so a new one can be created.
                    this.__connectionPromise = null;

                    //clean any inflight messages, they need to FAIL, but in a retryable way.
                    const error = createError(500, "[REST] WebSocket Closed");
                    error.isRetryable = true;
                    inflight.forEach(({ callback }) => callback(error));
                    inflight.clear();

                    //if we haven't resolved yet, then this is an *immediate* close by GraphIT.
                    //therefore we probably have an invalid token, and we should definitely reject.
                    if (!hasResolved) {
                        hasResolved = true;
                        initialToken.invalidate();
                        reject(error);
                    }
                };

                //on connection error, we almost certainly close after this anyway, so just
                //log the error
                ws.onerror = err => {
                    console.error("[REST] WebSocket Connection Error", err);
                };

                //how to handle inbound messages, find the inflight it matches and return
                ws.onmessage = msg => {
                    //we can only handle string messages
                    if (typeof msg.data !== "string") {
                        //we don't handle messages like this.
                        console.warn(
                            "[REST] unknown websocket message type",
                            msg
                        );
                        return;
                    }
                    //try and parse as JSON
                    let object;
                    try {
                        object = JSON.parse(msg.data);
                    } catch (e) {
                        console.warn(
                            "[REST] invalid JSON in websocket message",
                            msg.data
                        );
                        return;
                    }
                    //ok, we should now have an ID we can use.
                    const id = object.id;
                    const handle = inflight.get(id);
                    if (!handle) {
                        console.warn(
                            "[REST] unknown ID in websocket response",
                            id
                        );
                        return;
                    }
                    if (handle.debug) {
                        console.log("WS: onmessage for request", dump(object));
                    }
                    // check for error response.
                    if (object.error) {
                        if (handle.debug) {
                            console.log(
                                "WS: onmessage reports error, cleaning up"
                            );
                        }
                        //remove object from inflight immediately.
                        inflight.delete(id);

                        //this is an error message, but it may be more than that.
                        const error = createError(
                            object.error.code,
                            object.error.message ||
                                "[REST] Unknown GraphIT Error"
                        );
                        return handle.callback(error);
                    }

                    //in the old protocol, body was "result".
                    const body = this.useLegacyProtocol
                        ? object.result
                        : object.body;

                    if (!object.multi) {
                        if (handle.debug) {
                            console.log(
                                "WS: single packet response",
                                dump(body)
                            );
                        }
                        //This is a single packet response.
                        handle.callback(null, body);
                    } else if (handle.debug) {
                        console.log("WS: multi packet response:", body);
                    }

                    //if this is a partial, add data to the inflight request.
                    if (!handle.result) {
                        handle.result = [];
                    }

                    // this case is when no results at all are found for a query.
                    // NB, all real response bodies are `truthy` (even empty array and empty object)
                    // so if this is `falsy` then we didn't get a result. In the new protocol, that
                    // happens in a "multi" response when there where no hits.
                    // NOP. we can have gremlin/count results with a single numeric/string value
                    // so we check those too
                    if (body || body === 0 || body === "") {
                        if (handle.debug) {
                            console.log("WS: batching up results:", body);
                        }
                        handle.result.push(body);
                    }

                    if (object.more === true) {
                        if (handle.debug) {
                            console.log("WS: more results expected");
                        }
                        return;
                    }
                    if (handle.debug) {
                        console.log("WS: req finished, clean up and return");
                    }
                    //final response
                    //remove object from inflight immediately.
                    inflight.delete(id);
                    //ok, we should have an array in handle.result
                    handle.callback(null, handle.result);
                };

                //now the socket is opened we can resolve our promise with a client API
                ws.onopen = () => {
                    this.protocol = ws.protocol;
                    if (
                        !this.useLegacyProtocol &&
                        ws.protocol !== GRAPH_API_PROTOCOL
                    ) {
                        throw Object.assign(
                            new Error(
                                `Expecting Graph API SubProtocol: '${GRAPH_API_PROTOCOL}', got: '${ws.protocol}'`
                            ),
                            {
                                protocolError: {
                                    expected: GRAPH_API_PROTOCOL,
                                    actual: ws.protocol
                                }
                            }
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
                        resolve({
                            //this is how we initiate a send and create the callback.
                            send: (
                                token,
                                { type, headers, body },
                                { debug = false } = {}
                            ) => {
                                if (debug) {
                                    console.log("WS: fetch token", {
                                        type,
                                        headers,
                                        body
                                    });
                                }
                                //first we get the new Token.
                                return token.get().then(tok => {
                                    const id = nextId();
                                    const payload = JSON.stringify({
                                        _TOKEN: tok,
                                        id,
                                        type,
                                        headers,
                                        body
                                    });
                                    if (debug) {
                                        console.log(
                                            "WS: got token",
                                            dump(payload)
                                        );
                                    }
                                    return new Promise((_resolve, _reject) => {
                                        if (ws.readyState !== WS.OPEN) {
                                            //we may have closed whilst waiting for the token.
                                            //always retry.
                                            if (debug) {
                                                console.log(
                                                    "WS: connection closed before send called"
                                                );
                                            }
                                            return connectionClosedBeforeSend;
                                        }
                                        ref();
                                        const callback = (err, data) => {
                                            unref();
                                            if (debug) {
                                                console.log(
                                                    "WS: send callback",
                                                    err,
                                                    data
                                                );
                                            }
                                            return err
                                                ? _reject(err)
                                                : _resolve(data);
                                        };

                                        //create a callback for the inflight requests.
                                        inflight.set(id, {
                                            callback,
                                            debug
                                        });

                                        //now send the request.
                                        ws.send(payload);
                                    });
                                });
                            }
                        });
                    }, 100);
                };
            });
        });
    }
}

WebSocketTransport.PROTOCOL = GRAPH_API_PROTOCOL;
