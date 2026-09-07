import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import { createResolveAliases } from '../build/vite-shared-options';

const projectRoot = resolve(__dirname, '..');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      ...createResolveAliases(projectRoot),
      // The demo imports the package by its published name so it reads like a
      // consumer, but it must exercise the local source — otherwise a
      // regression in libs/ is invisible here. Object keys match the exact
      // specifier or a `key/` prefix, so the longer subpath goes first.
      'vue3-maplibre-gl/maplibre': resolve(
        projectRoot,
        'libs/maplibre-reexports.ts',
      ),
      'vue3-maplibre-gl': resolve(projectRoot, 'libs/index.ts'),
    },
  },
  server: {
    host: true,
    port: 9000,
  },
});
