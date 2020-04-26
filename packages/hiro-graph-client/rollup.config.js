import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/index.ts',
    output: [
        {
            format: 'umd',
            dir: 'build/umd',
            sourcemap: true,
            name: 'HiroGraphClient',
        },
        {
            format: 'esm',
            dir: 'build/esm',
            sourcemap: true,
        },
    ],
    plugins: [
        json(),
        resolve({
            browser: true,
        }),
        typescript(),
        commonjs({
            namedExports: {
                'websocket/lib/browser.js': ['w3cwebsocket'],
            },
        }),
    ],
};
