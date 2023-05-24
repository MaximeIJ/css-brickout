import {defineConfig} from 'vite';
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig({
  base: '',
  build: {
    minify: true,
    outDir: 'demo-pages',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        entryFileNames: 'assets/[name].js',
      },
      input: {
        demo: './index.html',
      },
    },
  },
  plugins: [removeConsole()],
});
