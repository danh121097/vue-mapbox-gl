import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@libs': resolve(__dirname, './libs'),
      '@libs/composables': resolve(__dirname, './libs/composables'),
      '@libs/enums': resolve(__dirname, './libs/enums'),
      '@libs/types': resolve(__dirname, './libs/types'),
      '@libs/components': resolve(__dirname, './libs/components'),
    },
  },
  build: {
    rollupOptions: {
      external: ['vue', 'maplibre-gl'],
      output: {
        globals: {
          vue: 'Vue',
          'maplibre-gl': 'maplibregl',
        },
        exports: 'named',
      },
    },
    lib: {
      entry: resolve(__dirname, './libs/index.ts'),
      name: 'VueMapbox',
      fileName: 'index',
      formats: ['es', 'umd'],
    },
  },
});
