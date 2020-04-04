export default function timer({ laps = true } = {}) {
    let start = Date.now();

    return laps
        ? () => {
              // this version resets the "start" every call
              const now = Date.now();
              const lap = now - start;

              start = now;

              return lap;
          }
        : () => Date.now() - start; // this version always returns time since initialisation
}
