var plugins = require('./plugins');
module.exports = {
    presets: [
        // ES features necessary for user's Node version
        [
            require('babel-preset-env').default,
            {
                targets: {
                    node: 'current',
                },
            },
        ],
        // JSX, Flow
        require.resolve('babel-preset-react'),
    ],
    plugins: plugins.concat([
        // Compiles import() to a deferred require()
        require.resolve('babel-plugin-dynamic-import-node'),
    ]),
};
