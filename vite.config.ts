import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

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
      external: ['vue', 'mapbox-gl']
    }
  }
});
