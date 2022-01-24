import WebsocketTransport, { webSocketsAvailable } from './transport-websocket';

export { webSocketsAvailable };

export default class PooledWebsocketTransport {
    constructor(endpoint, { poolSize = 1, ...wsOptions } = {}) {
        if (
            typeof poolSize !== 'number' ||
            isNaN(poolSize) ||
            poolSize < 1 ||
            poolSize > 1024
        ) {
            throw new Error(
                'Invalid `poolSize` should be an integer between 1 and 1024, got: ' +
                    poolSize,
            );
        }

        const pool = Array.from(
            { length: Math.floor(poolSize) },
            () => new WebsocketTransport(endpoint, wsOptions),
        );
        let lastConnectionIndex = 0;

        this.request = (token, data, options = {}) => {
            const index = lastConnectionIndex;

            lastConnectionIndex = (lastConnectionIndex + 1) % poolSize;

            if (options.emit) {
                options.emit({
                    name: 'pool:select',
                    size: poolSize,
                    index: index,
                });
            }

            return pool[index].request(token, data, options);
        };
    }
}
