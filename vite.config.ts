import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['libs/**/*'],
      exclude: ['examples/**/*', 'node_modules/**/*'],
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: true,
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
    cssCodeSplit: false,
    rollupOptions: {
      external: ['vue'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.js',
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
        },
        {
          format: 'umd',
          entryFileNames: 'index.umd.cjs',
          name: 'VueMapbox',
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
        },
      ],
    },
    lib: {
      entry: resolve(__dirname, './libs/index.ts'),
      name: 'VueMapbox',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd'],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
