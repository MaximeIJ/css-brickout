module.exports = {
  base: '',
  root: './src', // specify your source directory
  build: {
    outDir: '../dist', // specify your build output directory
    emptyOutDir: true, // empty the output directory before building
    assetsInlineLimit: 0, // set the inline assets limit to 0 to always copy assets to the output directory
  },
  resolve: {
    alias: {
      // Add TypeScript file extension alias
      '@/*': require('path').resolve(__dirname, 'src') + '/*.ts',
    },
  },
};
