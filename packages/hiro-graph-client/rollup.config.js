/* eslint-disable import/no-anonymous-default-export */
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';

import pkg from './package.json';

const external = [
    ...Object.keys(pkg.dependencies || {}),
    'rxjs',
    'lodash',
    'rxjs/operators',
    'lodash/memoize',
    'lodash/omit',
    'rxjs/webSocket',
];

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: 'src/index.ts',
        external,
        output: [
            //  { file: pkg.main, format: 'cjs', exports: 'named' },
            { file: pkg.main, format: 'es', sourcemap: true },
        ],
        plugins: [del({ targets: 'lib/*' }), typescript(), commonjs()],
    },
];
