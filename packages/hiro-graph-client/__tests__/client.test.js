/* eslint-env jest */
import createMockClient from "../src/mock";
import Token from "../src/token";
import * as errors from "../src/errors";
import clientTestHelper from "../__mocks__/client-test-helper.js";

// test all know good response types. all known error types.
// edge cases like 404, or 409 being OK responses (connect/disconnect)
// bad token causing failure
// etc...
describe("Client Requests", () => {
    const client = createMockClient();

    const tests = clientTestHelper(client);
    beforeEach(() => {
        client.resetMockTransport();
    });

    // uncomment the next line to enable debug logging
    //client.introspect(evt => console.log(evt));

    tests.forEach(({ name, fn }) => {
        it(`should call ${name} correctly`, async () => {
            client.enqueueMockResponse({});
            // we just have to make sure it resolves period.
            // we will handle expected values for those functions that don't
            // pass the responses right through directly.
            await expect(fn().then(() => true)).resolves.toEqual(true);
            // we only want the three main properties of the request
            const { type, headers, body } = client.retrieveLastRequest();
            expect({ type, headers, body }).toMatchSnapshot();
        });
    });
});

describe("Client Response handling", () => {
    const fn = jest.fn();
    const token = new Token({
        getToken: () => "token",
        onInvalidate: fn
    });
    const client = createMockClient(token);

    beforeEach(async () => {
        client.resetMockTransport();
        await token.get(); // we want to ensure the token invalidation state is reset each time.
        fn.mockClear();
    });

    const retryableErrors = [
        {
            name: "transaction fail (888)",
            err: errors.transactionFail()
        },
        {
            name: "unauthorized (401)",
            err: errors.unauthorized()
        },
        {
            name: "generic retryable error",
            err: Object.assign(new Error(), { isRetryable: true })
        }
    ];

    retryableErrors.forEach(({ name, err }) => {
        it(`should retry once on '${name}'`, async () => {
            client.enqueueMockResponse(err, "ok");
            await expect(client.me()).resolves.toBe("ok");

            client.enqueueMockResponse(err, err);
            await expect(client.me()).rejects.toBe(err);
        });
    });

    it("should unconditionally retry for `connection closed before send`", async () => {
        const err = errors.connectionClosedBeforeSend;
        // many connection closed, one other error in the middle, should still resolve "ok"
        /* prettier-ignore */
        client.enqueueMockResponse(err, err, err, err, errors.transactionFail(), err, err, err, err, "ok");
        await expect(client.me()).resolves.toBe("ok");
    });

    it("should handle `conflict` as OK for connect", async () => {
        const conflict = errors.conflict();
        const forbidden = errors.forbidden();
        client.enqueueMockResponse(conflict, forbidden);
        await expect(
            client.connect("foo", "bar", "baz")
        ).resolves.toBeUndefined(); // connect returns nothing on success
        await expect(client.connect("foo", "bar", "baz")).rejects.toBe(
            forbidden
        );
    });

    it("should handle `conflict` and `not found` as OK for disconnect", async () => {
        const conflict = errors.conflict();
        const notFound = errors.notFound();
        const forbidden = errors.forbidden();
        client.enqueueMockResponse(conflict, forbidden, notFound);
        await expect(
            client.disconnect("foo", "bar", "baz")
        ).resolves.toBeUndefined(); // disconnect returns nothing on success

        await expect(client.disconnect("foo", "bar", "baz")).rejects.toBe(
            forbidden
        );
        await expect(
            client.disconnect("foo", "bar", "baz")
        ).resolves.toBeUndefined(); // disconnect returns nothing on success
    });

    const dedupableMethods = [
        ["me"],
        ["get", "some-id"],
        ["lucene", "*:*"],
        ["ids", ["a", "b"]],
        ["gremlin", "root-id", "outE()"]
    ];

    dedupableMethods.forEach(([method, ...args]) => {
        it(
            "should correctly dedup the requests for method: " + method,
            async () => {
                let resolve;
                const promise = new Promise(r => (resolve = r));
                // note that we only enqueue a single result
                // so both client methods MUST only make a single
                // request or it will fail Bad Request
                client.enqueueMockResponse(promise);
                const req1 = client[method](...args);
                const req2 = client[method](...args);
                resolve({ foo: "bar" });
                const res1 = await req1;
                const res2 = await req2;

                // these expectations is that bot res1 and res2 returned the same result
                // but not the same object.
                expect(res1).toEqual(res2);
                expect(res1).not.toBe(res2);
            }
        );
    });
    it("should invalidate the token on `unauthorized`", async () => {
        // ok first, then non invalidation error, then invalidation error, then notfound.
        // we need another error after, so the retry can pick it up
        const notFound = errors.notFound();
        const unauthorized = errors.unauthorized();
        client.enqueueMockResponse(
            "OK",
            notFound,
            unauthorized,
            notFound,
            "OK"
        );

        await expect(client.me()).resolves.toBe("OK");
        expect(fn).not.toHaveBeenCalled();

        await expect(client.me()).rejects.toBe(notFound);
        expect(fn).not.toHaveBeenCalled();

        //this one should invalidate
        await expect(client.me()).rejects.toBe(notFound);
        expect(fn).toHaveBeenCalledTimes(1);

        await expect(client.me()).resolves.toBe("OK");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
