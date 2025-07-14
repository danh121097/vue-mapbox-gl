import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Optimize Vue SFC compilation
      template: {
        compilerOptions: {
          // Enable hoisting for better performance
          hoistStatic: true,
          // Cache inline component props
          cacheHandlers: true,
        },
      },
    }),
    dts({
      include: ['libs/**/*'],
      exclude: ['examples/**/*', 'node_modules/**/*'],
      insertTypesEntry: true,
      rollupTypes: false, // Disable rollup types to avoid API extractor issues
      copyDtsFiles: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@libs': resolve(__dirname, './libs'),
      '@libs/composables': resolve(__dirname, './libs/composables'),
      '@libs/enums': resolve(__dirname, './libs/enums'),
      '@libs/types': resolve(__dirname, './libs/types'),
      '@libs/components': resolve(__dirname, './libs/components'),
      '@libs/helpers': resolve(__dirname, './libs/helpers'),
    },
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['vue', 'maplibre-gl'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.js',
          globals: {
            vue: 'Vue',
            'maplibre-gl': 'maplibregl',
          },
          exports: 'named',
          // Optimize output
          compact: true,
          // Enable manual chunks for better tree-shaking
          manualChunks: (id) => {
            // Group composables together
            if (id.includes('composables')) {
              return 'composables';
            }
            // Group components together
            if (id.includes('components')) {
              return 'components';
            }
          },
        },
        {
          format: 'umd',
          entryFileNames: 'index.umd.cjs',
          name: 'VueMapLibreGL',
          globals: {
            vue: 'Vue',
            'maplibre-gl': 'maplibregl',
          },
          exports: 'named',
          compact: true,
        },
      ],
      // Optimize tree-shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    lib: {
      entry: resolve(__dirname, './libs/index.ts'),
      name: 'VueMapLibreGL',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd'],
    },
    sourcemap: true,
    minify: 'terser', // Use terser for better compression
    // Terser options for optimal compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
        // Remove unused code
        dead_code: true,
        // Optimize conditionals
        conditionals: true,
        evaluate: true,
        // Optimize loops
        loops: true,
        // Optimize comparisons
        comparisons: true,
        // Optimize sequences
        sequences: true,
        // Optimize properties
        properties: true,
        // Optimize join consecutive var statements
        join_vars: true,
        // Collapse single-use vars
        collapse_vars: true,
        // Reduce variables to constants when possible
        reduce_vars: true,
        // Optimize if-return and if-continue
        if_return: true,
        // Inline simple functions
        inline: 2,
        // Optimize typeof
        typeofs: true,
        // Optimize booleans
        booleans: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Enable CSS optimization
    cssMinify: true,
    // CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue'],
    exclude: ['maplibre-gl'], // Let users handle maplibre-gl optimization
  },
});
