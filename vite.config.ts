/// <reference types="vitest" />

import {resolve} from 'path';

import {UserConfig, defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
import removeConsole from 'vite-plugin-remove-console';

const build: UserConfig['build'] = {
  lib: {
    // Could also be a dictionary or array of multiple entry points
    entry: [resolve(__dirname, 'src/index.ts')],
    name: 'CSS Brickout',
    fileName: 'css-brickout',
  },
  cssCodeSplit: false,
  sourcemap: false,
  outDir: 'dist',
};

export default defineConfig({
  build,
  esbuild: {
    minifyIdentifiers: false,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    removeConsole({includes: ['log', 'warn', 'error', 'debug']}),
  ],
  test: {
    environment: 'jsdom',
  },
});
