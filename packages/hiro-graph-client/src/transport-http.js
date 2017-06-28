/**
 *  The HTTP version of the transport.
 *  It support the `request` method,
 *  But translates them to `fetch` methods.
 */
import fetch from "isomorphic-fetch";
import { create as createError } from "./errors";

export default class HttpTransport {
    constructor(endpoint) {
        this.endpoint = endpoint.replace(/\/$/, ""); //remove trailing slash.
    }

    //this is basically window.fetch with a token.get() before it.
    fetch(token, url, options = {}, reqOptions = {}) {
        let tokenPromise;
        const tokenSupplied = "token" in reqOptions;
        if (!tokenSupplied) {
            //this is the likely path!
            tokenPromise = token.get();
        } else {
            tokenPromise = Promise.resolve(reqOptions.token);
        }
        return tokenPromise.then(tok => {
            //add to query string or add query string.
            //if the given url is full (e.g. starts http), don't use our endpoint.
            //otherwise do.
            const urlPrefix = url.indexOf("http") === 0 ? "" : this.endpoint;
            let urlWithToken;
            if (tok) {
                const qsSeperator = url.indexOf("?") === -1 ? "?" : "&";
                urlWithToken = `${urlPrefix}${url}${qsSeperator}_TOKEN=${tok}`;
            } else {
                urlWithToken = `${urlPrefix}${url}`;
            }
            const fetchPromise = fetch(urlWithToken, options);
            if (options.raw === true) {
                return fetchPromise;
            }
            return fetchPromise
                .then(res => {
                    if (res.status === 204) {
                        //we aren't expecting content
                        return [204, {}];
                    }
                    return res.json().then(
                        object => {
                            //we want the status code as well.
                            return [res.status, object];
                        },
                        () => {
                            //parse error.
                            return [
                                500,
                                {
                                    error:
                                        "Invalid JSON in response from GraphIT"
                                }
                            ];
                        }
                    );
                })
                .then(([status, object]) => {
                    //check for error.
                    if ("error" in object) {
                        let errorMessage = "Unknown GraphIT Error";
                        if (typeof object.error === "string") {
                            errorMessage = object.error;
                        } else if (
                            typeof object.error === "object" &&
                            typeof object.error.message === "string"
                        ) {
                            errorMessage = object.error.message;
                        }
                        const error = createError(
                            status,
                            "[HTTP] Error: " + errorMessage
                        );
                        //the "connection" decides what to do with each error.
                        throw error;
                    }
                    //what to do here, if "items" in object, then we return items, other
                    //things return plain graphit nodes (which CANNOT have items as a key - they need a slash).
                    if ("items" in object) {
                        return object.items;
                    }
                    //assume it is the object we want.
                    return object;
                });
        });
    }

    //request has to translate the base request objects to fetch.
    request(token, { type, headers = {}, body = {} } = {}, reqOptions = {}) {
        const [url, options] = createFetchOptions({ type, headers, body });
        return this.fetch(token, url, options, reqOptions);
    }

    defaultOptions() {
        return defaultFetchOptions();
    }
}

//exported for use in the connection
export const defaultFetchOptions = () => ({
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
    mode: "cors"
});

//here are the mappings to fetch options from the websocket payloads.
function createFetchOptions({ type, headers = {}, body = {} } = {}) {
    let url;
    const options = defaultFetchOptions();
    switch (type) {
        case "me":
            url = "/_me";
            break;
        case "info":
            url = "/info";
            break;
        case "get":
            url = "/" + encodeURIComponent(headers["ogit/_id"]);
            break;
        case "create":
            url = "/new/" + encodeURIComponent(headers["ogit/_type"]);
            if (headers.waitForIndex) {
                url += "?waitForIndex=true";
            }
            options.body = JSON.stringify(body);
            options.method = "POST";
            break;
        case "update":
            url = "/" + encodeURIComponent(headers["ogit/_id"]);
            options.method = "POST";
            if (headers.waitForIndex) {
                url += "?waitForIndex=true";
            }
            options.body = JSON.stringify(body);
            break;
        case "replace":
            url = "/" + encodeURIComponent(headers["ogit/_id"]);
            options.method = "PUT";
            const extraHeader = [];
            if (headers.createIfNotExists) {
                extraHeader.push(
                    "createIfNotExists=" +
                        (headers.createIfNotExists ? "true" : "false") +
                        "&ogit%2f_type=" +
                        encodeURIComponent(headers["ogit/_type"])
                );
            }
            if (headers.waitForIndex) {
                extraHeader.push("waitForIndex=true");
            }
            if (extraHeader.length) {
                url += "?" + extraHeader.join("&");
            }

            options.body = JSON.stringify(body);
            break;
        case "delete":
            url = "/" + encodeURIComponent(headers["ogit/_id"]);
            options.method = "DELETE";
            break;
        case "connect":
            url = "/connect/" + encodeURIComponent(headers["ogit/_type"]);
            options.body = JSON.stringify(body);
            options.method = "POST";
            break;
        case "query":
            url = "/query/" + headers.type;
            options.body = JSON.stringify(body);
            options.method = "POST";
            break;
        default:
            throw new Error(`[HTTP] Unknown API call: ${type}`);
    }
    return [url, options];
}
