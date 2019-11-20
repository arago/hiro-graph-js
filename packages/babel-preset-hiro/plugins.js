var path = require('path');
var env = process.env.BABEL_ENV || process.env.NODE_ENV || 'development';

var plugins = [
    [
        require.resolve('babel-plugin-module-resolver'),
        {
            root: ['./src'],
        },
    ],
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-function-bind'),
    [
        require.resolve('babel-plugin-transform-object-rest-spread'),
        {
            useBuiltIns: true,
        },
    ],
    [
        require.resolve('babel-plugin-transform-react-jsx'),
        {
            useBuiltIns: true,
        },
    ],
    [
        require.resolve('babel-plugin-transform-runtime'),
        {
            helpers: false,
            polyfill: false,
            regenerator: true,
            // Resolve the Babel runtime relative to the config.
            moduleName: path.dirname(require.resolve('babel-runtime/package')),
        },
    ],
    // Handle __DEV__ expression
    require.resolve('babel-plugin-dev-expression'),
];

if (env === 'development' || env === 'test') {
    plugins.push.apply(plugins, [
        // Adds component stack to warning messages
        require.resolve('babel-plugin-transform-react-jsx-source'),
        // Adds __self attribute to JSX which React will use for some warnings
        require.resolve('babel-plugin-transform-react-jsx-self'),
    ]);
}

module.exports = plugins;
