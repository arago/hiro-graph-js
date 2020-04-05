import Token, { cannotGetToken } from './token';
import Client from './client';
import { StreamFilter } from './eventstream';
import * as Errors from './errors';

export default Client;
export * from './gremlin';
export * from './lucene';
export * from './types/ogit';
export { Token, cannotGetToken, Errors, StreamFilter };

/*
@todo

* Add testing
* Ensure old tests pass
* Dedup?
* Websocket reconnect?
* Servlets back in
* Add rollup
* body/query typings
*/
