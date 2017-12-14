/**
 *  Each instance of events stream subscribes to the /_events/ endpoint of GraphIT
 *  Filters can be applied to each stream and events are emitted.
 *  The GraphIT connection does not keep hold of these eventstreams, the consumer does.
 *  The streams are clever enough to keep track of their position and reconnect (with current
 *  filters) on the event of connection failure. Should the token expire and connection fail,
 *  if it is renewed by any other part of the app that shares the `Token` object, it will reconnect
 *  and continue to emit events.
 */
import { w3cwebsocket as WebSocket } from "websocket";
import { ensureWebSocketsAvailable } from "./transport-websocket";
import { channel } from "./subscriber-fanout";
import qs from "querystring";

const RECONNECT_TIMEOUT = 5e3;

export default class EventStream {
    static OFFSET_NEWEST_MSG = "largest";
    static OFFSET_OLDEST_MSG = "smallest";

    constructor(
        { endpoint, token },
        { groupId, offset = EventStream.OFFSET_NEWEST_MSG, filters = [] } = {}
    ) {
        ensureWebSocketsAvailable();
        this._token = token;
        this._endpoint = endpoint
            .replace(/^http/, "ws") //replace http(s) with ws(s)
            .replace(/\/?$/, "/_events/?"); // replace possible trailing slash with api endpoint
        const query = {};
        if (groupId) {
            query.groupId = groupId;
        }
        if (offset) {
            query.offset = offset;
        }
        this._endpoint += qs.stringify(query) + "&_TOKEN="; // this needs to be last...

        this._groupId = groupId;
        this._offset = offset;
        this._filters = filters.map(content => ({
            "filter-id": content,
            "filter-type": "jfilter",
            "filter-content": content
        }));
        //we don't connect immediately.
        // but via a pubsub interface.
        this.subscribe = channel(fanout => {
            // connect, then apply filters, then start emitting events.
            // we only need the client here.
            let socket, reconnectTimeout;
            let shouldShutdown = false;
            const shutdown = () => {
                clearTimeout(reconnectTimeout);
                shouldShutdown = true;
                if (socket) {
                    socket.close();
                }
                socket = null;
            };
            const reconnect = () =>
                (reconnectTimeout = setTimeout(connect, RECONNECT_TIMEOUT));

            // this is the loop that gets the connection and uses it, reconnecting
            // until it's told to shutdown.
            const connect = async () => {
                if (shouldShutdown) {
                    return;
                }
                try {
                    const initialToken = await this._token.get();
                    if (shouldShutdown) {
                        return;
                    }
                    socket = await this.__createWebSocket(
                        initialToken,
                        fanout,
                        () => {
                            if (!shouldShutdown) {
                                reconnect();
                            }
                        }
                    );
                } catch (e) {
                    reconnect();
                }
            };
            // start the recurrent connect process
            connect();
            // return the shutdown function.
            return shutdown;
        });
    }

    /**
     *  Creates a WebSocket connection, with the initial token.
     *
     *  Similiar logic to the websocket-transport
     */
    __createWebSocket(intialToken, emit, onClose) {
        //we do all this in a promise, so the result is shared between
        //all requests that come in during connection.
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this._endpoint + intialToken);

            //this keeps track of whether we have resolved yet.
            let hasResolved = false;

            //when the connection closes we need to tidy up.
            ws.onclose = () => {
                //if we haven't resolved yet, then this is an *immediate* close by GraphIT.
                //therefore we probably have an invalid token, and we should definitely reject.
                if (!hasResolved) {
                    hasResolved = true;
                    this._token.invalidate();
                    reject();
                } else {
                    onClose();
                }
            };

            //on connection error, we almost certainly close after this anyway, so just
            //log the error
            ws.onerror = err => {
                console.error("[EVT] WebSocket Connection Error", err);
            };

            //how to handle inbound messages, find the inflight it matches and return
            ws.onmessage = msg => {
                //we can only handle string messages
                if (typeof msg.data !== "string") {
                    //we don't handle messages like this.
                    console.warn("[EVT] unknown websocket message type", msg);
                    return;
                }
                //try and parse as JSON
                let object;
                try {
                    object = JSON.parse(msg.data);
                } catch (e) {
                    console.warn(
                        "[EVT] invalid JSON in websocket message",
                        msg.data
                    );
                    return;
                }
                //this event should have properties:
                //
                //  id: the id of the object entity (who it was done to)
                //  identity: the id of the subject entity (who did it)
                //  type: what was done (CREATE, UPDATE, ...)
                //  timestamp: hammertime (milliseconds since unix epoch)
                //  nanotime: ??? (does not appear to be nanoseconds since unix epoch)
                //  body: the full content of the object entity
                emit(object);
            };

            //now the socket is opened we can resolve our promise with a client API
            ws.onopen = () => {
                //actually if we send a bad token, we need to wait for a moment before resolving.
                //otherwise, the connection will shut straightaway.
                //testing shows this usually takes about 10ms, but the largest time I saw was
                //32ms. We use 100ms just in case. This makes the initial connection slower, but
                //is a one off cost and not a problem with the events stream. Also, we might as well
                //try and apply the filters immediately.
                // now apply all filters.
                this._filters.forEach(filter =>
                    ws.send(
                        JSON.stringify({
                            type: "register",
                            args: filter
                        })
                    )
                );
                setTimeout(() => {
                    if (hasResolved) {
                        //crap, we did fail.
                        return;
                    }
                    //now mark this as resolving so we don't invalidate our token accidentally.
                    hasResolved = true;
                    resolve(ws);
                }, 100);
            };
        });
    }
}
