import {resolve} from 'path';

import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

const config = {
  base: '/css-brickout/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'demo/index.html'),
      },
      output: {
        preserveModules: false,
      },
    },
    outDir: './demo-pages',
  },
};

export default defineConfig(config);
