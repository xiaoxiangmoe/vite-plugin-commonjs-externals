import ts from 'rollup-plugin-typescript2';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

const external = [...Object.keys(pkg.dependencies)];

const defaults = {
  external,
  plugins: [ts()],
};

export default [
  {
    ...defaults,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: 'inline',
    },
  },
  {
    ...defaults,
    input: 'src/index-cjs.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: 'inline',
    },
  },
];
