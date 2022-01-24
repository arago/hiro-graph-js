const noop = () => {};

// This helper is for creating simple "event" listeners.
// It returns a `fanout` function that sends an event
// to all subscribers. The subscribe method registers a
// listener for the events and returns an unsubscribe
// method. To enable RxJS-like "only start on subscription"
// functionality, it also returns an `onStart` and an `onStop`
// method to register a handler for "now we have a subscriber"
// and "now we have no subscribers" respectively.
export default function subscriberFanout(onStart = noop, onStop = noop) {
    const subs = [];
    const fanout = (event) => {
        subs.forEach((fn) => {
            try {
                fn(event);
            } catch (e) {
                console.warn('error thrown in fanout fn', fn);
                console.error(e);
            }
        });
    };

    const subscribe = (fn) => {
        if (subs.indexOf(fn) === -1) {
            subs.push(fn);

            if (subs.length === 1) {
                onStart(fanout);
            }
        }

        return () => {
            if (subs.length !== 0) {
                subs.splice(subs.indexOf(fn), 1);

                if (subs.length === 0) {
                    return onStop(fanout);
                }
            }
        };
    };

    return { fanout, subscribe };
}

// this is the pure setup/shutdown model
// initialise takes "fanout" and returns "onStop"
// the function returns only the subscribe function.
// mimic's redux-saga's `eventChannel` model
export function channel(initialise) {
    let stop = noop;
    const onStart = (fanout) => {
        stop = initialise(fanout);
    };
    const onStop = () => {
        stop();
        stop = noop;
    };
    const { subscribe } = subscriberFanout(onStart, onStop);

    return subscribe;
}
