/**
 *  Each instance of events stream subscribes to the /_events/ endpoint of GraphIT
 *  Filters can be applied to each stream and events are emitted.
 *  The GraphIT connection does not keep hold of these eventstreams, the consumer does.
 *  The streams are clever enough to keep track of their position and reconnect (with current
 *  filters) on the event of connection failure. Should the token expire and connection fail,
 *  if it is renewed by any other part of the app that shares the `Token` object, it will reconnect
 *  and continue to emit events.
 */
import qs from 'querystring';

import { w3cwebsocket as WebSocket } from 'websocket';

import { ensureWebSocketsAvailable } from './transport-websocket';
import { channel } from './subscriber-fanout';
import timer from './timer';
import { EVENTS_WS_API_BASE } from './api-version';

const noop = () => {};

const RECONNECT_TIMEOUT = 5e3;
const EVENTS_PROTOCOL = 'events-1.0.0';

export default class EventStream {
    static OFFSET_NEWEST_MSG = 'largest';
    static OFFSET_OLDEST_MSG = 'smallest';

    constructor(
        { endpoint, token },
        { groupId, offset = EventStream.OFFSET_NEWEST_MSG, filters = [] } = {},
        emit = noop, // this function is used to hook into all internal events.
    ) {
        ensureWebSocketsAvailable();
        this._token = token;
        this._endpoint = endpoint
            .replace(/^http/, 'ws') //replace http(s) with ws(s)
            .replace(/\/?$/, `${EVENTS_WS_API_BASE}/?`); // replace possible trailing slash with api endpoint

        const query = {};

        if (groupId) {
            query.groupId = groupId;
        }

        if (offset) {
            query.offset = offset;
        }

        this._endpoint += qs.stringify(query);

        this._groupId = groupId;
        this._offset = offset;
        this._filters = filters.map((content) => ({
            'filter-id': content,
            'filter-type': 'jfilter',
            'filter-content': content,
        }));
        this._emit = emit;
        this._socket = null;
        //we don't connect immediately.
        // but via a pubsub interface.
        this.subscribe = channel((fanout) => {
            // connect, then apply filters, then start emitting events.
            // we only need the client here.
            let reconnectTimeout;
            let shouldShutdown = false;
            let reconnects = 0; // start at -1 and the first connect
            const t = timer({ laps: false });

            emit({
                name: 'es:power-up',
                data: { filters, groupId, offset },
            });

            const shutdown = () => {
                emit({
                    name: 'es:power-down',
                    data: t(),
                });
                clearTimeout(reconnectTimeout);
                shouldShutdown = true;

                if (this._socket) {
                    emit({
                        name: 'es:closing',
                        data: { time: t(), reconnects },
                    });
                    this._socket.close();
                }

                this._socket = null;
            };
            const reconnect = () =>
                (reconnectTimeout = setTimeout(
                    () => connect(true),
                    RECONNECT_TIMEOUT,
                ));

            // this is the loop that gets the connection and uses it, reconnecting
            // until it's told to shutdown.
            const connect = (isReconnect = false) => {
                if (shouldShutdown) {
                    return;
                }

                const conntime = timer();

                return this._token
                    .get()
                    .then((initialToken) => {
                        emit({
                            name: 'token:get',
                            data: { time: conntime(), token: initialToken },
                        });

                        if (shouldShutdown) {
                            return;
                        }

                        return this.__createWebSocket(
                            initialToken,
                            fanout,
                            () => {
                                if (!shouldShutdown) {
                                    reconnect();
                                }
                            },
                            emit,
                        ).then((_socket) => {
                            this._socket = _socket;

                            if (isReconnect) {
                                reconnects++;
                            }

                            emit({
                                name: 'es:connect',
                                data: { time: conntime(), reconnects },
                            });
                        });
                    })
                    .catch((e) => {
                        emit({ name: 'es:error', data: e });
                        reconnect();
                    });
            };

            // start the recurrent connect process
            connect();

            // return shutdown function.
            return shutdown;
        });
    }

    /**
     * Register new filter for the same connection.
     * All updates for newly registered filters will be passed to subscribed callback.
     *
     * @param filter - String
     */

    register(filter) {
        const filterObj = {
            'filter-id': filter,
            'filter-type': 'jfilter',
            'filter-content': filter,
        };

        this._filters.push(filterObj);

        // If there is still no connection it's ok. We'll subscribe latter
        if (this._socket) {
            this._socket.send(
                JSON.stringify({
                    type: 'register',
                    args: filterObj,
                }),
            );
        }

        // Emit unregister filter just in case
        this._emit({
            name: 'es:register-filter',
            data: { filter, offset: this._offset, groupId: this._groupId },
        });
    }

    /**
     * Unregisters existing filter by sending request to server with type unregister.
     * Stop getting events for this filter
     *
     * @param filterId - String
     */

    unregister(filterId) {
        this._filters = this._filters.filter(
            (filter) => filter['filter-id'] !== filterId,
        );

        //If there is still no connection it's ok. We won't subscribe
        if (this._socket) {
            this._socket.send(
                JSON.stringify({
                    type: 'unregister',
                    args: {
                        'filter-id': filterId,
                    },
                }),
            );
        }

        // Emit unregister filter just in case
        this._emit({
            name: 'es:unregister-filter',
            data: { 'filter-id': filterId },
        });
    }

    /**
     *  Creates a WebSocket connection, with the initial token.
     *
     *  Similiar logic to the websocket-transport
     *
     * confusingly, "fanout" is to fanout events from the eventstream
     * and "emit" is the pubsub emitter passes to all hiro-graph-client components for
     * introspection
     */
    __createWebSocket(initialToken, fanout, onClose, emit) {
        //we do all this in a promise, so the result is shared between
        //all requests that come in during connection.
        const t = timer();

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this._endpoint, [
                EVENTS_PROTOCOL,
                `token-${initialToken}`,
            ]);

            //this keeps track of whether we have resolved yet.
            let hasResolved = false;

            //when the connection closes we need to tidy up.
            ws.onclose = () => {
                emit({ name: 'es:sock-close', data: t() });

                //if we haven't resolved yet, then this is an *immediate* close by GraphIT.
                //therefore we probably have an invalid token, and we should definitely reject.
                if (!hasResolved) {
                    hasResolved = true;
                    this._token.invalidate();
                    emit({ name: 'es:invalidate', data: null });
                    reject();
                } else {
                    onClose();
                }
            };

            //on connection error, we almost certainly close after this anyway, so just
            //log the error
            ws.onerror = (err) => {
                emit({ name: 'es:sock-error', data: err });
            };

            //how to handle inbound messages, find the inflight it matches and return
            ws.onmessage = (msg) => {
                //we can only handle string messages
                if (typeof msg.data !== 'string') {
                    //we don't handle messages like this.
                    emit({ name: 'es:bad-message', data: msg.data });

                    return;
                }

                //try and parse as JSON
                let object;

                try {
                    object = JSON.parse(msg.data);
                } catch (e) {
                    emit({ name: 'es:bad-message', data: msg.data });

                    return;
                }

                emit({ name: 'es:message', data: object });
                //this event should have properties:
                //
                //  id: the id of the object entity (who it was done to)
                //  identity: the id of the subject entity (who did it)
                //  type: what was done (CREATE, UPDATE, ...)
                //  timestamp: hammertime (milliseconds since unix epoch)
                //  nanotime: ??? (does not appear to be nanoseconds since unix epoch)
                //  body: the full content of the object entity
                fanout(object);
            };

            //now the socket is opened we can resolve our promise with a client API
            ws.onopen = () => {
                emit({
                    name: 'es:sock-open',
                    data: { time: t(), protocol: ws.protocol },
                });
                //actually if we send a bad token, we need to wait for a moment before resolving.
                //otherwise, the connection will shut straightaway.
                //testing shows this usually takes about 10ms, but the largest time I saw was
                //32ms. We use 100ms just in case. This makes the initial connection slower, but
                //is a one off cost and not a problem with the events stream. Also, we might as well
                //try and apply the filters immediately.
                // now apply all filters.
                this._filters.forEach((filter) =>
                    ws.send(
                        JSON.stringify({
                            type: 'register',
                            args: filter,
                        }),
                    ),
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
