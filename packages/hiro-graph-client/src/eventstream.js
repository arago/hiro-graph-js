/**
 *  Each instance of events stream subscribes to the /_events/ endpoint of GraphIT
 *  Filters can be applied to each stream and events are emitted.
 *  The GraphIT connection does not keep hold of these eventstreams, the consumer does.
 *  The streams are clever enough to keep track of their position and reconnect (with current
 *  filters) on the event of connection failure. Should the token expire and connection fail,
 *  if it is renewed by any other part of the app that shares the `Token` object, it will reconnect
 *  and continue to emit events.
 */
import { ensureWebSocketsAvailable } from "./transport-websocket";

//unique ids.
let _id = 0;
const nextId = () => {
    const n = _id++;
    if (_id > 1e9) {
        //this has got big. let's reset.
        _id = 0;
    }
    return "" + n; //needs to be a string.
};

const cloneEvent = evt => {
    //the only "deep" prop is the "body", and it's just one level deep.
    return Object.assign({}, evt, { body: Object.assign({}, evt.body) });
};

export default class EventStream {
    constructor({ endpoint, token }) {
        ensureWebSocketsAvailable();
        this.token = token;
        this.endpoint = endpoint
            .replace(/^http/, "ws") //replace http(s) with ws(s)
            .replace(/\/?$/, "/_events/?_TOKEN="); // replace possible trailing slash with api endpoint
        this.callbacks = [];
        this.filters = [];
        //we don't connect immediately.
    }

    connected() {
        return this.__connectionPromise;
    }

    //stop events.
    stop() {
        this.stopped = true;
        if (!this.connected()) {
            return;
        }
        return this.connect().then(ws => {
            ws.close();
        });
    }

    //start events
    start() {
        this.stopped = false;
        if (this.connected()) {
            return;
        }
        //don't actually return the connection.
        return this.connect().then(() => {});
    }

    //Private function used to broadcast events.
    emit(event) {
        //return as a promise in case we want to wait for the callbacks.
        return Promise.all(this.callbacks.map(fn => fn(cloneEvent(event))));
    }

    //Start a subscription to events. returns a function used to remove the subscription
    subscribe(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("callback must be a function");
        }
        this.callbacks.push(callback);
        //return the unsubscribe function.
        return () =>
            (this.callbacks = this.callbacks.filter(fn => fn !== callback));
    }

    //Register a filter to the stream.
    //returns the unregister function.
    filter(type, content) {
        const id = nextId();
        const filter = {
            "filter-id": id,
            "filter-type": type,
            "filter-content": content
        };
        this.filters.push(filter);
        const unfilter = () => {
            this.filters = this.filters.filter(f => f["filter-id"] !== id);
            return (
                this.connected() &&
                this.connect().then(ws =>
                    ws.send(
                        JSON.stringify({
                            type: "unregister",
                            args: { "filter-id": id }
                        })
                    )
                )
            );
        };

        if (this.connected()) {
            return this.connect()
                .send({
                    type: "register",
                    args: filter
                })
                .then(() => unfilter);
        }
        return Promise.resolve(unfilter);
    }

    //clear all filters.
    clear() {
        this.filters = [];
        return this.connect().then(ws =>
            ws.send(
                JSON.stringify({
                    type: "clear",
                    args: {}
                })
            )
        );
    }

    connect() {
        if (!this.__connectionPromise) {
            this.__connectionPromise = this.token
                .get()
                .then(token => this.createWebSocket(token));
        }
        return this.__connectionPromise;
    }

    /**
     *  Creates a WebSocket connection, with the initial token.
     *
     *  Similiar logic to the websocket-transport
     */
    createWebSocket(intialToken) {
        //we do all this in a promise, so the result is shared between
        //all requests that come in during connection.
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.endpoint + intialToken);

            //this keeps track of whether we have resolved yet.
            let hasResolved = false;

            //when the connection closes we need to tidy up.
            ws.onclose = () => {
                //most importantly, remove this promise. so a new one can be created.
                this.__connectionPromise = null;

                //if we haven't resolved yet, then this is an *immediate* close by GraphIT.
                //therefore we probably have an invalid token, and we should definitely reject.
                if (!hasResolved) {
                    hasResolved = true;
                    this.token.invalidate();
                    reject();
                }
                //We want to reconnect unless this.stopped
                if (!this.stopped) {
                    this.connect();
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
                this.emit(object);
            };

            //now the socket is opened we can resolve our promise with a client API
            ws.onopen = () => {
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
                    resolve(ws);
                    //now add all our filters.
                    this.filters.forEach(filter => {
                        ws.send(
                            JSON.stringify({
                                type: "register",
                                args: filter
                            })
                        );
                    });
                }, 100);
            };
        });
    }
}
