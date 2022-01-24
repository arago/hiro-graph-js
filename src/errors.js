/**
 *  helper for errors.
 */
//we keep a list here.
const errors = {};

const is = (code) => (err) => err.code && err.code === code;
const factory = (code, defaultMsg) => {
    //side effect of creating this, populates an index.
    errors[code] = (msg = defaultMsg, error = new Error()) => {
        error.message = msg;
        error.code = code;

        return error;
    };

    return errors[code];
};

//this creates new errors for a given error code an caches them
export const create = (code, msg, error = new Error()) => {
    if (code in errors) {
        return errors[code](msg, error);
    }

    return factory(code, `Unknown Error (${code})`)(msg, error);
};

//export all the common errors.
export const notFound = factory(404, 'Not Found');
export const isNotFound = is(404);
export const forbidden = factory(403, 'Forbidden');
export const isForbidden = is(403);
export const unauthorized = factory(401, 'Unauthorized');
export const isUnauthorized = is(401);
export const badRequest = factory(400, 'Bad Request');
export const isBadRequest = is(400);
export const conflict = factory(409, 'Conflict');
export const isConflict = is(409);
export const transactionFail = factory(888, 'Transaction Failed');
export const isTransactionFail = is(888);
export const unknown = factory(500, 'Unknown Error');
//this is slightly different, no code, or code greater than or equal 500.
export const isUnknown = (err) => !err.code || err.code / 100 >= 5;

//another error is that the connection was closed before we got the chance to send data.
//this is a special case
export const connectionClosedBeforeSend = new Error(
    'Connection closed while waiting for token',
);
