/* eslint-env jest */
import Client from "../src/client";
import { mockFn } from "isomorphic-fetch";
import clientTestHelper from "../__mocks__/client-test-helper.js";

const fakeTokenPromise = Promise.resolve("<token>");
const onInvalidate = jest.fn();
const fakeToken = { get: () => fakeTokenPromise, onInvalidate };

// These test are run with a client, in order to assure that the correct
// client calls result in the correct HTTP requests.
describe("transport-http", () => {
    // uses the real HttpTransport, but with fake fetch
    const client = new Client(
        { endpoint: "https://graphit/", token: fakeToken },
        { forceHTTP: true }
    );

    const tests = clientTestHelper(client);

    beforeEach(() => mockFn.mockReset());

    tests.forEach(({ name, fn }) => {
        it(`should create the right options for: ${name}`, async () => {
            // for now every request should recieve the same mock response.
            mockFn.mockReturnValueOnce([200, {}]);
            await fn();
            expect(mockFn).toHaveBeenCalledTimes(1);
            // @IMPORTANT check the snapshots! They must be correct the first time or these tests are worthless!
            expect(mockFn.mock.calls[0]).toMatchSnapshot(); //i.e. correct options created
        });
    });

    it("should handle bad http responses appropriately", async () => {
        const bad = [
            [200, "Totally invalid response"],
            [403, { error: { code: 403, message: "forbidden" } }],
            [404, { error: { code: 404, message: "not found" } }]
        ];
        for (let i = 0; i < bad.length; i++) {
            mockFn.mockReturnValueOnce(bad[i]);
            let error;
            try {
                await client.me();
            } catch (e) {
                error = { code: e.code, message: e.message };
            }
            expect(error).toBeDefined();
            expect(error).toMatchSnapshot();
        }
    });
});
