// This is a fake websocket implementation for the transport test.
// of course we need to be able to send data to it, from outside.
// and monitor what happens to it from inside.
import EventEmitter from 'events';

const sockEmitter = new EventEmitter();

const onNextSocket = (fn: any) => {
  sockEmitter.once('send', fn);
};

const w3cwebsocket = function fakeWebsocket(endpoint: any, protocol: any) {
  const e = new EventEmitter() as any;

  e.endpoint = endpoint;
  e.protocol = protocol && protocol.length > 0 ? protocol[0] : undefined;

  // @ts-ignore
  e.readyState = w3cwebsocket.CONNECTING;
  e.on('open', () => {
    // @ts-ignore
    e.readyState = w3cwebsocket.OPEN;
  });
  e.on('close', () => {
    // @ts-ignore
    e.readyState = w3cwebsocket.CLOSED;
  });
  sockEmitter.emit('new', e);

  // but we use the old `on` style  bindings. in our code. node's eventemitter
  //  only does "on" and "addEventListener"
  //
  ['open', 'close', 'message', 'error'].forEach((k) => {
    e.on(k, (...args: any[]) => {
      if (typeof e['on' + k] === 'function') {
        e['on' + k](...args);
      }
    });
  });
  // finally our mock needs a send function.
  e.send = (...args: any[]) => {
    e.emit('send', ...args);
  };

  return e;
};

[
  // add the websocket constants
  'CONNECTING',
  'OPEN',
  'CLOSING',
  'CLOSED',
].forEach((prop, i) =>
  Object.defineProperty(w3cwebsocket, prop, { get: () => i }),
);

export { w3cwebsocket, onNextSocket };
