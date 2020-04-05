import Token, { cannotGetToken } from './token';
import Client from './client';
import { StreamFilter } from './eventstream';
import * as Errors from './errors';

export default Client;
export * from './gremlin';
export * from './lucene';
export * from './ogit';
export { Token, cannotGetToken, Errors, StreamFilter };

/*
@todo

* Add testing
* Ensure old tests pass
* Dedup?
* Websocket reconnect?
* Lucene/gremlin helpers built in to client function
* Servlets back in

*/
