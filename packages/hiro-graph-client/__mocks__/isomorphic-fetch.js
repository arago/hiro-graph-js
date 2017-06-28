/* eslint-env jest */
// mock of isomorphic-fetch for tests.
// fetch is a single function so we mock it with a
const f = require.requireActual("isomorphic-fetch");
const Response = global.Response;
const mockFn = jest.fn();

export { mockFn };

export default function fetch(...args) {
    // wrap the outcome of the mock function in a "new Response";
    const result = mockFn(...args);
    if (!result) {
        return Promise.resolve(new Response(JSON.stringify({ args })));
    }
    const [status, body] = result;
    if (body instanceof Error) {
        return Promise.reject(body);
    } else if (typeof body === "string") {
        return Promise.resolve(new Response(body, { status }));
    } else {
        return Promise.resolve(new Response(JSON.stringify(body), { status }));
    }
}
