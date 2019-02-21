// This is a fake websocket implementation for the transport test.
// of course we need to be able to send data to it, from outside.
// and monitor what happens to it from inside.
import EventEmitter from "events";

const sockEmitter = new EventEmitter();

const onNextSocket = fn => sockEmitter.once("new", fn);

const w3cwebsocket = function fakeWebsocket(endpoint, protocol) {
    const e = new EventEmitter();
    e.endpoint = endpoint;
    e.protocol = protocol ? protocol.split(",")[0] : undefined;
    e.readyState = w3cwebsocket.CONNECTING;
    e.on("open", () => {
        e.readyState = w3cwebsocket.OPEN;
    });
    e.on("close", () => {
        e.readyState = w3cwebsocket.CLOSED;
    });
    sockEmitter.emit("new", e);

    // but we use the old `on` style  bindings. in our code. node's eventemitter
    //  only does "on" and "addEventListener"
    //
    ["open", "close", "message", "error"].forEach(k => {
        e.on(k, (...args) => {
            if (typeof e["on" + k] === "function") {
                e["on" + k](...args);
            }
        });
    });
    // finally our mock needs a send function.
    e.send = (...args) => {
        e.emit("send", ...args);
    };

    return e;
};

[
    // add the websocket constants
    "CONNECTING",
    "OPEN",
    "CLOSING",
    "CLOSED"
].forEach((prop, i) =>
    Object.defineProperty(w3cwebsocket, prop, { get: () => i })
);

export { w3cwebsocket, onNextSocket };
