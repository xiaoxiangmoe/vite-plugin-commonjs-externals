// @ts-check
import * as fs from 'node:fs';
import ts from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';

/** @type {import('./package.json')} */
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
];

/** @type { Array<import('rollup').RollupOptions> } */
const config = [
  {
    external,
    plugins: [
      ts({
        tsconfigOverride: {
          noEmit: true,
        },
      }),
    ],
    input: 'src/index.ts',
    output: [
      {
        file: pkg.exports['.'].import,
        format: 'esm',
        sourcemap: 'inline',
      },
      {
        file: pkg.exports['.'].require,
        format: 'cjs',
        sourcemap: 'inline',
        footer: 'module.exports.default = module.exports;',
      },
    ],
  },
  {
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          // see https://github.com/unjs/unbuild/pull/57/files
          preserveSymlinks: false,
        },
      }),
    ],
    external,
    input: './src/index.ts',
    output: [
      { file: pkg.exports['.'].require.replace('.cjs', '.d.cts') },
      { file: pkg.exports['.'].import.replace('.mjs', '.d.mts') },
    ],
  },
];

export default config;
