//a cancelable promise
export const cancelablePromise = promise => {
    let rejectHandler = () => {};
    let rejection = false;
    const cancel = reason => {
        rejection = reason;
        rejectHandler(reason);
    };
    return Object.assign(
        new Promise((resolve, reject) => {
            if (rejection) {
                reject(rejection);
            }
            rejectHandler = reject;
            return promise.then(resolve, reject);
        }),
        { cancel }
    );
};
