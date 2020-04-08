// @ts-ignore
import { mockFn } from 'isomorphic-fetch';
import { Subject, BehaviorSubject, of, Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { Token } from '../src/token';
import * as errors from '../src/errors';
import clientTestHelper from '../__mocks__/client-test-helper';
import Client from '../src';

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

  responses.forEach((res) => {
    mock.mockReturnValueOnce(
      new Observable((subscriber) => {
        if (Array.isArray(res)) {
          res.forEach((r) => enqueue(subscriber, r));
        } else {
          enqueue(subscriber, res);
        }

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
      await expect(
        fn()
          .toPromise()
          .then(() => true),
      ).resolves.toEqual(true);
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
      enqueueMockResponse(mockRequest, [err, 'ok'], [err, err]);

      await expect(client.me().toPromise()).resolves.toBe('ok');

      await expect(client.me().toPromise()).rejects.toBe(err);
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

    await expect(client.me().toPromise()).resolves.toBe('ok');
  });

  it('should handle `conflict` as OK for connect', async () => {
    const conflict = errors.conflict();
    const forbidden = errors.forbidden();

    enqueueMockResponse(mockRequest, conflict, forbidden);

    await expect(
      client.connect('foo', 'bar', 'baz').toPromise(),
    ).resolves.toBeUndefined(); // connect returns nothing on success

    await expect(client.connect('foo', 'bar', 'baz').toPromise()).rejects.toBe(
      forbidden,
    );
  });

  it('should handle `conflict` and `not found` as OK for disconnect', async () => {
    const conflict = errors.conflict();
    const notFound = errors.notFound();
    const forbidden = errors.forbidden();

    enqueueMockResponse(mockRequest, conflict, forbidden, notFound);

    await expect(
      client.disconnect('foo', 'bar', 'baz').toPromise(),
    ).resolves.toBeUndefined(); // disconnect returns nothing on success

    await expect(
      client.disconnect('foo', 'bar', 'baz').toPromise(),
    ).rejects.toBe(forbidden);

    await expect(
      client.disconnect('foo', 'bar', 'baz').toPromise(),
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
      [unauthorized, notFound],
      'OK',
    );

    await expect(client.me().toPromise()).resolves.toBe('OK');
    expect(mockInvalidate).not.toHaveBeenCalled();

    await expect(client.me().toPromise()).rejects.toBe(notFound);
    expect(mockInvalidate).not.toHaveBeenCalled();

    //this one should invalidate
    await expect(client.me().toPromise()).rejects.toBe(notFound);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);

    await expect(client.me().toPromise()).resolves.toBe('OK');
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });
});
