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
      name: 'SqkiiMapboxGl',
      fileName: 'sqkii-mapbox-gl'
    },
    rollupOptions: {
      external: ['vue', 'mapbox-gl'],
      output: {
        exports: 'named',
        globals: {
          vue: 'vue',
          'mapbox-gl': 'mapbox-gl'
        }
      }
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      { find: '@enums', replacement: resolve(__dirname, './src/enums') },
      {
        find: '@components',
        replacement: resolve(__dirname, './src/components')
      }
    ]
  }
});
