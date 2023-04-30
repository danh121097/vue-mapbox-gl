import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Vue3Mapbox',
      fileName: 'vue3-mapbox'
    },
    rollupOptions: {
      external: ['vue', 'maplibre-gl'],
      output: {
        exports: 'named',
        globals: {
          vue: 'vue',
          'maplibre-gl': 'maplibreGl'
        }
      }
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      {
        find: '@constants',
        replacement: resolve(__dirname, './src/constants')
      },
       {
        find: '@enums',
        replacement: resolve(__dirname, './src/enums')
      },
      {
        find: '@components',
        replacement: resolve(__dirname, './src/components')
      },
      {
        find: '@helpers',
        replacement: resolve(__dirname, './src/helpers')
      },
      {
        find: '@types',
        replacement: resolve(__dirname, './src/types')
      }
    ]
  }
});
