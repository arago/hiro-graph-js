/* eslint-env jest */

import EventEmitter from 'events';

// @ts-ignore
import { onNextSocket, w3cwebsocket } from 'websocket'; // this is the mock!
import { WebSocketSubject } from 'rxjs/webSocket';
import { Subject } from 'rxjs';

import { WebSocketTransport } from '../src/transport-websocket';
import { Token } from '../src/token';

const onInvalidate = jest.fn();
const fakeToken = new Token({
  getToken: () => Promise.resolve('<token>'),
  onInvalidate,
});

// These tests are run with the transport directly, because the onus is on correct handling of the
// websockets themselves
describe('transport-websocket', () => {
  const transport = new WebSocketTransport('https://graphit/');

  // it doesn't connect until we ask it
  let sock: EventEmitter;
  const multiplex = jest.fn();

  const getRequestId = () => {
    return new Promise((resolve) => {
      multiplex.mockImplementation((subMsg) => {
        const { id } = subMsg();

        resolve(id);

        const sub$ = new Subject();

        sock.on('message', (msg: any) => {
          if (msg.id === id || msg.error) {
            sub$.next(msg);
          }
        });

        return sub$;
      });
    });
  };
  const emitResponse = (obj: any) => {
    sock.emit('message', obj);
  };
  const getIdAndResPromise = async (req: any) => {
    const idp = getRequestId();
    const res = transport.request(fakeToken, req).toPromise();
    const id = await idp;

    return { id, res };
  };

  /*
   * Connect to fake socket
   * Store socket for sending and listening
   * Replace multiplex to handle receiving
   */
  const connect = async () => {
    const _token = await fakeToken.get();

    const connection$ = transport.connect(_token);

    connection$.subscribe();

    // @ts-ignore
    sock = connection$._socket;

    // @ts-ignore
    connection$.multiplex = multiplex;
  };

  beforeAll(async () => {
    // this is a setup pain, but without it we couldn't easily use this transport in many tests
    // with making them reliant on each other.
    await connect();
  });

  // this test is simply a validation of the beforeAll.
  it('should connect on demand', async () => {
    expect(sock).toBeDefined();
  });

  it('should handle inbound messages, even if there have been no outbound', () => {
    let t = () => {
      sock.emit('message', {
        data: 'this is not an expected message, or JSON',
      });
      sock.emit('message', {
        data: new ArrayBuffer(10),
      });
      sock.emit('message', { data: undefined });
      sock.emit('message', {
        data: JSON.stringify({
          id: 'foo',
          more: false,
          multi: true,
          body: 'this is valid but unexpected',
        }),
      });
    };

    expect(t).not.toThrow();
  });

  it('should handle inbound messages bound for a given request', async () => {
    const { id, res } = await getIdAndResPromise({ type: 'foo' });
    const response = { foobar: 'bazquux' };

    // and send a response
    emitResponse({
      id,
      multi: false,
      body: response,
    });

    const result = await res;

    expect(result).toEqual(response);
    // and it should ingore subsequent data for that same ID, and not return it with a different request.
    expect(() =>
      emitResponse({
        id,
        multi: false,
        body: { different: 'response', same: 'id' },
      }),
    ).not.toThrow();
  });

  it('should handle intermingled results', async () => {
    const { id: id1, res: res1 } = await getIdAndResPromise({ type: 'a' });
    const { id: id2, res: res2 } = await getIdAndResPromise({ type: 'b' });

    //now send some results.
    emitResponse({ id: id2, multi: true, more: true, body: 0 });
    emitResponse({ id: id2, multi: true, more: true, body: 1 });
    emitResponse({ id: id2, multi: true, more: true, body: 2 });

    emitResponse({ id: 'totally unrelated' }); // just to throw a spanner in

    emitResponse({ id: id2, multi: true, more: true, body: 3 });
    emitResponse({ id: id2, multi: true, more: true, body: 4 });

    // now we should send some for result one
    emitResponse({ id: id1, multi: true, more: true, body: 10 });
    emitResponse({ id: id1, multi: true, more: true, body: 11 });
    emitResponse({ id: id1, multi: true, more: true, body: 12 });
    emitResponse({ id: id1, multi: true, more: true, body: 13 });
    emitResponse({ id: id1, multi: true, more: true, body: 14 });

    // now finish the second first...
    emitResponse({ id: id2, multi: true, more: false, body: null });
    // and the first, second...
    emitResponse({ id: id1, multi: true, more: false, body: null });

    // now check the responses
    expect(await res2).toEqual([0, 1, 2, 3, 4]);
    expect(await res1).toEqual([10, 11, 12, 13, 14]);
  });

  // it('should handle connection failure', async () => {
  //   const { id, res } = await getIdAndResPromise({ type: 'fail' });

  //   // send one response and then fail the connection.
  //   emitResponse({ id, multi: true, more: true, body: 'foo' });

  //   // now fail.
  //   sock.emit('error', new Error('Mock Closed Connection'));
  //   sock.emit('close');
  //   await expect(res).rejects.toBeDefined();

  //   // the key is also being able to reconnect.
  //   const lastSock = sock;

  //   await connect();
  //   // we have to do this one manually.
  //   transport.request(fakeToken, { type: 'getme' }).toPromise();
  //   // and leave the promise hanging... but we also have to wait for a bunch of
  //   // promises to resolve...

  //   expect(lastSock).not.toBe(sock);
  // });
});
