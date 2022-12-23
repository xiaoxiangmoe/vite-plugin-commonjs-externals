# vite-plugin-commonjs-externals [![npm](https://img.shields.io/npm/v/vite-plugin-commonjs-externals.svg)](https://npmjs.com/package/vite-plugin-commonjs-externals)

Provides commonjs externals support for Vite.

## Description

Prevent bundling of certain _esm_ `import`ed packages and instead retrieve these external dependencies at runtime by _commonjs_ `require`.

For example:

```ts
import commonjsExternals from 'vite-plugin-commonjs-externals';

const externals = ['path', /^electron(\/.+)?$/];

export default {
  optimizeDeps: {
    exclude: externals,
  },
  plugins: commonjsExternals({
    externals,
  }),
};
```

This will convert it

```ts
import fs from 'fs';
import * as path from 'path';
import e1 from 'electron';
import e2, * as e3 from 'electron/main';

console.log({ fs, path, e1, e2, e3 });
```

to

```ts
import * as fs from 'fs';
const path = (() => {
  const mod = require('path');
  return mod?.__esModule
    ? mod
    : Object.assign(Object.create(null), mod, {
        default: mod,
        [Symbol.toStringTag]: 'Module',
      });
})();
const { default: e1 } = (() => {
  const mod = require('electron');
  return mod?.__esModule
    ? mod
    : Object.assign(Object.create(null), mod, {
        default: mod,
        [Symbol.toStringTag]: 'Module',
      });
})();
const e3 = (() => {
  const mod = require('electron/main');
  return mod?.__esModule
    ? mod
    : Object.assign(Object.create(null), mod, {
        default: mod,
        [Symbol.toStringTag]: 'Module',
      });
})();
const { default: e2 } = e3;
console.log({ fs, path, e1, e2, e3 });
```

## React + Electron renderer Config Example

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { escapeRegExp } from 'lodash';
import reactRefresh from '@vitejs/plugin-react-refresh';
import builtinModules from 'builtin-modules';
// For two package.json structure
import pkg from '../the-path-to-main-process-dir/package.json';
// For single package.json structure
import pkg from './package.json';
import commonjsExternals from 'vite-plugin-commonjs-externals';

const commonjsPackages = [
  'electron',
  'electron/main',
  'electron/common',
  'electron/renderer',
  'original-fs',
  ...builtinModules,
  ...Object.keys(pkg.dependencies).map(
    name => new RegExp('^' + escapeRegExp(name) + '(\\/.+)?$')
  ),
] as const;

export default defineConfig({
  optimizeDeps: {
    exclude: commonjsPackages,
  },
  plugins: [reactRefresh(), commonjsExternals({ externals: commonjsPackages })],
});
```
