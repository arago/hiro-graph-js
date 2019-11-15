var path = require('path');
var plugins = require('./plugins');
var node = require('./node');
var env = process.env.BABEL_ENV || process.env.NODE_ENV || 'development';

if (env === 'test') {
    module.exports = function(context, opts) {
        return node;
    };
} else {
    module.exports = function(context, opts) {
        if (!opts) {
            opts = {
                library: false,
            };
        }
        // false for webpack, "commonjs" for library builds
        const modules = opts.library ? 'commonjs' : false;
        const config = {
            presets: [
                // Latest stable ECMAScript features
                [
                    require.resolve('babel-preset-env'),
                    {
                        targets: {
                            // React parses on ie 9, so we should too
                            ie: 9,
                            // We currently minify with uglify
                            // Remove after https://github.com/mishoo/UglifyJS2/issues/448
                            uglify: true,
                        },
                        // Disable polyfill transforms
                        useBuiltIns: false,
                        modules: modules,
                    },
                ],
                // JSX, Flow
                require.resolve('babel-preset-react'),
            ],
            plugins: plugins.concat([
                // function* () { yield 42; yield 43; }
                [
                    require.resolve('babel-plugin-transform-regenerator'),
                    {
                        // Async functions are converted to generators by babel-preset-env
                        async: false,
                    },
                ],
                // Adds syntax support for import()
                require.resolve('babel-plugin-syntax-dynamic-import'),
            ]),
        };
        if (env === 'production') {
            plugins.push.apply(plugins, [
                require.resolve(
                    'babel-plugin-transform-react-constant-elements',
                ),
                require.resolve('babel-plugin-transform-react-inline-elements'),
            ]);
        }
        return config;
    };
}
