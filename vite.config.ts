import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      imports: ['vue', 'vue-router']
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@libs/enums': fileURLToPath(new URL('./src/libs/enums', import.meta.url)),
      '@libs/helpers': fileURLToPath(new URL('./src/libs/helpers', import.meta.url)),
      '@libs/hooks': fileURLToPath(new URL('./src/libs/hooks', import.meta.url)),
      '@libs/types': fileURLToPath(new URL('./src/libs/types', import.meta.url)),
      '@libs/components': fileURLToPath(new URL('./src/libs/components', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      external: ['vue', 'maplibre-gl'],
      output: {
        globals: {
          vue: 'Vue',
          'maplibre-gl': 'maplibregl'
        },
        exports: 'named'
      }
    },
    lib: {
      entry: pathResolve('./src/libs/index.ts'),
      name: 'VueMapbox',
      fileName: 'index',
      formats: ['es', 'umd']
    }
  }
})
