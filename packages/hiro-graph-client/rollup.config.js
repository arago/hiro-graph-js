/* eslint-disable import/no-extraneous-dependencies */
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const extensions = ['.ts'];

const config = {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'umd',
            name: 'hiro-graph',
            exports: 'named',
        },
        {
            file: pkg.unpkg,
            format: 'umd',
            name: 'hiro-graph',
            exports: 'named',
            plugins: [terser()],
        },
        {
            file: pkg.module,
            format: 'esm',
        },
    ],
    plugins: [
        resolve({ browser: true, extensions }),
        json(),
        commonjs({
            namedExports: {
                'websocket/lib/browser.js': ['w3cwebsocket'],
            },
        }),
        typescript(),
        babel({ extensions, exclude: 'node_modules/**' }),
    ],
};

export default config;
