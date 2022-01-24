// A mock Transport for the Client that will allow us to test the client (and therefore also the ORM)
// without having to have a live GraphIT environment.
import * as errors from './errors';
import Client from './client';

export class MockTransport {
    constructor() {
        // OK, we setup a stack of responses that can be cleared.
        // each request simply shifts off a response.
        this._responses = [];
        this._requests = [];
        this.errors = errors; // for simplicity you don't need to import them all in consuming code
    }

    // enqueues responses from the graph
    // note that this `push`s and the request function `shift`s reponses
    enqueue(...response) {
        this._responses.push(...response);
    }

    // fetches and removes the last request in the stack
    getLastRequest() {
        return this._requests.pop();
    }

    clear() {
        this._responses.length = 0;
        this._requests.length = 0;
    }

    // for compatibility with http transport
    defaultOptions() {
        return { headers: {} };
    }
    fetch(tok, url, options = {}) {
        return this.request(tok, {
            type: 'fetch',
            headers: options.headers,
            body: url,
        });
    }

    // this is the main interface for a transport
    request(tok, { type, headers, body }, options) {
        if (this._responses.length === 0) {
            //there was no response given for this request.
            console.warn(`MockTransport.request called but no response was queued.
The request was:
${JSON.stringify({ type, headers, body }, null, 2)}

Please add a mock response for it to return.`);

            return Promise.reject(errors.badRequest());
        }

        const req = { type, headers, body, options };
        const res = this._responses.shift();

        // otherwise use the first in the stack
        // store the requests for introspection
        this._requests.push(req);

        if (res instanceof Error) {
            return Promise.reject(res);
        } else {
            return Promise.resolve(res);
        }
    }
}

export default function createMockClient(token = 'mock-token') {
    const transport = new MockTransport();
    const client = new Client(
        {
            endpoint: 'mock://graphit',
            token: token,
        },
        transport,
    );

    client.resetMockTransport = () => transport.clear();
    client.enqueueMockResponse = (...args) => transport.enqueue(...args);
    client.retrieveLastRequest = () => transport.getLastRequest();
    client.debugMockRequests = (arg) => transport.debugMockRequests(arg);
    client.http = transport; // this has to be the http transport as well.

    return client;
}
