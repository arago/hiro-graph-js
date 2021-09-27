// @ts-ignore
import { mockFn } from 'isomorphic-fetch';
import { of, Observable } from 'rxjs';

import { Token } from '../src/token';
import * as errors from '../src/errors';
import clientTestHelper from '../__mocks__/client-test-helper';
import Client, { toPromise } from '../src';

const getClient = () => {
  const mockRequest = jest.fn();
  const mockInvalidate = jest.fn();
  const token = new Token({
    getToken: () => 'token',
    onInvalidate: mockInvalidate,
  });
  const client = new Client(
    { endpoint: 'https://graphit/', token },
    { forceHTTP: true },
  );

  // @ts-ignore
  client.transport.request = mockRequest;

  return { client, token, mockInvalidate, mockRequest };
};

const enqueueMockResponse = (mock: jest.Mock, ...responses: any[]) => {
  const enqueue = (subscriber: any, res: any) => {
    if (typeof res === 'object') {
      subscriber.error(res);
    } else {
      subscriber.next(res);
    }
  };

  responses.flat().forEach((res) => {
    mock.mockReturnValueOnce(
      new Observable((subscriber) => {
        enqueue(subscriber, res);

        subscriber.complete();
      }),
    );
  });
};

// test all know good response types. all known error types.
// edge cases like 404, or 409 being OK responses (connect/disconnect)
// bad token causing failure
// etc...
describe('Client Requests', () => {
  const { client, mockRequest } = getClient();

  const tests = clientTestHelper(client);

  beforeEach(() => {
    mockFn.mockReset();
    mockRequest.mockReset();
  });

  tests.forEach(({ name, fn }) => {
    it(`should call ${name} correctly`, async () => {
      //mockFn.mockReturnValueOnce([200, {}]);
      mockRequest.mockReturnValueOnce(of(true));

      // we just have to make sure it resolves period.
      // we will handle expected values for those functions that don't
      // pass the responses right through directly.
      await expect(toPromise(fn()).then(() => true)).resolves.toEqual(true);
      expect(mockRequest.mock.calls[0][1]).toMatchSnapshot(); //i.e. correct options created
    });
  });
});

describe('Client Response handling', () => {
  const { client, token, mockInvalidate, mockRequest } = getClient();

  beforeEach(async () => {
    mockRequest.mockReset();
    await token.get(); // we want to ensure the token invalidation state is reset each time.
    mockInvalidate.mockClear();
  });

  const retryableErrors = [
    {
      name: 'transaction fail (888)',
      err: errors.transactionFail(),
    },
    {
      name: 'unauthorized (401)',
      err: errors.unauthorized(),
    },
    {
      name: 'generic retryable error',
      err: Object.assign(new Error(), { isRetryable: true }),
    },
  ];

  retryableErrors.forEach(({ name, err }) => {
    it(`should retry once on '${name}'`, async () => {
      enqueueMockResponse(mockRequest, err, 'ok', err, err);

      const call = () => toPromise(client.me());

      await expect(call()).resolves.toBe('ok');

      await expect(call()).rejects.toBe(err);
    });
  });

  it('should unconditionally retry for `connection closed before send`', async () => {
    const err = errors.connectionClosedBeforeSend;

    // many connection closed, one other error in the middle, should still resolve "ok"

    enqueueMockResponse(mockRequest, [
      err,
      err,
      err,
      err,
      errors.transactionFail(),
      err,
      err,
      err,
      err,
      'ok',
    ]);

    // @todo How should this be triggered in RxJS?

    await expect(toPromise(client.me())).resolves.toBe('ok');
  }, 10000);

  it('should handle `conflict` as OK for connect', async () => {
    const conflict = errors.conflict();
    const forbidden = errors.forbidden();

    enqueueMockResponse(mockRequest, conflict, forbidden);

    await expect(
      toPromise(client.connect('foo', 'bar', 'baz')),
    ).resolves.toBeUndefined(); // connect returns nothing on success

    await expect(toPromise(client.connect('foo', 'bar', 'baz'))).rejects.toBe(
      forbidden,
    );
  });

  it('should handle `conflict` and `not found` as OK for disconnect', async () => {
    const conflict = errors.conflict();
    const notFound = errors.notFound();
    const forbidden = errors.forbidden();

    enqueueMockResponse(mockRequest, conflict, forbidden, notFound);

    await expect(
      toPromise(client.disconnect('foo', 'bar', 'baz')),
    ).resolves.toBeUndefined(); // disconnect returns nothing on success

    await expect(
      toPromise(client.disconnect('foo', 'bar', 'baz')),
    ).rejects.toBe(forbidden);

    await expect(
      toPromise(client.disconnect('foo', 'bar', 'baz')),
    ).resolves.toBeUndefined(); // disconnect returns nothing on success
  });

  //   const dedupableMethods = [
  //     ['me'],
  //     ['get', 'some-id'],
  //     ['lucene', '*:*'],
  //     ['ids', ['a', 'b']],
  //     ['gremlin', 'root-id', 'outE()'],
  //   ];

  //   dedupableMethods.forEach(([method, ...args]) => {
  //     it(
  //       'should correctly dedup the requests for method: ' + method,
  //       async () => {
  //         let resolve;
  //         const promise = new Promise((r) => (resolve = r));

  //         // note that we only enqueue a single result
  //         // so both client methods MUST only make a single
  //         // request or it will fail Bad Request
  //         client.enqueueMockResponse(promise);

  //         const req1 = client[method](...args);
  //         const req2 = client[method](...args);

  //         resolve({ foo: 'bar' });

  //         const res1 = await req1;
  //         const res2 = await req2;

  //         // these expectations is that bot res1 and res2 returned the same result
  //         // but not the same object.
  //         expect(res1).toEqual(res2);
  //         expect(res1).not.toBe(res2);
  //       },
  //     );
  //   });
  it('should invalidate the token on `unauthorized`', async () => {
    // ok first, then non invalidation error, then invalidation error, then notfound.
    // we need another error after, so the retry can pick it up
    const notFound = errors.notFound();
    const unauthorized = errors.unauthorized();

    enqueueMockResponse(
      mockRequest,
      'OK',
      notFound,
      unauthorized,
      notFound,
      'OK',
    );

    await expect(toPromise(client.me())).resolves.toBe('OK');
    expect(mockInvalidate).not.toHaveBeenCalled();

    await expect(toPromise(client.me())).rejects.toBe(notFound);
    expect(mockInvalidate).not.toHaveBeenCalled();

    //this one should invalidate
    await expect(toPromise(client.me())).rejects.toBe(notFound);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);

    await expect(toPromise(client.me())).resolves.toBe('OK');
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });
});
