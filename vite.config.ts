import {resolve} from 'path';

import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

const config = {
  base: '',
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: [resolve(__dirname, 'src/index.ts')],
      name: 'CSS Brickout',
      fileName: 'css-brickout',
    },
    outDir: 'dist',
  },
};

export default defineConfig({
  ...config,
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
