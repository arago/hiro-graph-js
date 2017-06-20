/* eslint-env jest */
import createMockClient from "../src/mock";
import Token from "../src/token";
import * as errors from "../src/errors";

// test all know good response types. all known error types.
// edge cases like 404, or 409 being OK responses (connect/disconnect)
// bad token causing failure
// etc...
describe("Client Requests", () => {
    const client = createMockClient();

    const tests = [
        {
            name: "me",
            fn: () => client.me()
        },
        {
            name: "info",
            fn: () => client.info()
        },
        {
            name: "get",
            fn: () => client.get("some-id")
        },
        {
            name: "create",
            fn: () => client.create("some-type", { some: "prop" })
        },
        {
            name: "create (waitForIndex)",
            fn: () =>
                client.create(
                    "some-type",
                    { some: "prop" },
                    { waitForIndex: true }
                )
        },
        {
            name: "update",
            fn: () => client.update("some-id", { "/foo": "bar" })
        },
        {
            name: "update (waitForIndex)",
            fn: () =>
                client.update(
                    "some-id",
                    { "/foo": "bar" },
                    { waitForIndex: true }
                )
        },
        {
            name: "replace",
            fn: () => client.replace("some-id", { "/foo": "bar" })
        },
        {
            name: "replace (createIfNotExists)",
            fn: () =>
                client.replace(
                    "some-id",
                    { "/foo": "bar" },
                    { createIfNotExists: "some-type" }
                )
        },
        {
            name: "replace (waitForIndex)",
            fn: () =>
                client.replace(
                    "some-id",
                    { "/foo": "bar" },
                    { waitForIndex: true }
                )
        },
        {
            name: "delete",
            fn: () => client.delete("some-id")
        },
        {
            name: "delete (waitForIndex)",
            fn: () => client.delete("some-id", { waitForIndex: true })
        },
        {
            name: "ids",
            fn: () => client.ids(["a", "b", "c"])
        },
        {
            name: "connect",
            fn: () => client.connect("some-verb", "the-in-id", "the-out-id")
        },
        {
            name: "disconnect",
            fn: () => client.disconnect("some-verb", "the-in-id", "the-out-id")
        },
        {
            name: "lucene (basic)",
            fn: () => client.lucene("*:*")
        },
        {
            name: "lucene (limits)",
            fn: () => client.lucene("*:*", { limit: -1, offset: 1000 })
        },
        {
            name: "lucene (placeholders)",
            fn: () => client.lucene("/foo:$bar", { bar: "123" })
        },
        {
            name: "lucene (count)",
            fn: () => client.lucene("*:*", { count: true })
        },
        {
            name: "lucene (order)",
            fn: () =>
                client.lucene("*:*", { order: ["/field1 asc", "/field2 desc"] })
        },
        {
            name: "lucene (fields)",
            fn: () => client.lucene("*:*", { fields: ["/field1", "/field2"] })
        },
        {
            name: "gremlin",
            fn: () => client.gremlin("root-id", "pow()")
        }
    ];

    beforeEach(() => {
        client.resetMockTransport();
    });

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
