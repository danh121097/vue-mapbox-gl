import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { dropOrphanChunks } from './build/drop-orphan-chunks-plugin';
import {
  assetFileNames,
  createResolveAliases,
  createVuePlugin,
  externalDependencies,
  preservedModuleFileNames,
  terserOptions,
  treeshakeOptions,
} from './build/vite-shared-options';

/**
 * ES build pass.
 *
 * Emits preserved modules — one output file per source file, mirroring `libs/`
 * — so a consumer importing a single component pulls only that component's
 * module graph. This also produces `dist/components/index.js`,
 * `dist/composables/index.js` and `dist/maplibre-reexports.js`, which back the
 * package's `exports` subpaths.
 *
 * The UMD single-file bundle is a second pass: see `vite.config.umd.ts`.
 */
export default defineConfig({
  plugins: [
    createVuePlugin(),
    dts({
      include: ['libs/**/*'],
      // Tests are still type-checked by `vue-tsc --noEmit`; they just must not
      // emit declarations into the published package.
      exclude: [
        'examples/**/*',
        'node_modules/**/*',
        'libs/**/__tests__/**',
        'libs/test-utils.ts',
      ],
      compilerOptions: {
        // Declaration maps point at `libs/` sources the package does not ship,
        // so they would only 404 in a consumer's editor.
        declarationMap: false,
      },
      insertTypesEntry: true,
      rollupTypes: false, // Disable rollup types to avoid API extractor issues
      copyDtsFiles: false,
    }),
    dropOrphanChunks(),
  ],
  resolve: {
    alias: createResolveAliases(__dirname),
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // This pass runs first and owns the clean slate. Running it on its own
    // therefore leaves a dist/ with no index.umd.cjs, which `main` and the
    // `require` condition still point at — always build via `bun run build`,
    // which chains the UMD pass after it.
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, './libs/index.ts'),
        'maplibre-reexports': resolve(
          __dirname,
          './libs/maplibre-reexports.ts',
        ),
        // Entries for the `./components` and `./composables` subpaths. Both are
        // pure re-export barrels, which Rollup elides unless they are entries.
        'components/index': resolve(__dirname, './libs/components/index.ts'),
        'composables/index': resolve(__dirname, './libs/composables/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: externalDependencies,
      output: {
        // One file per source module keeps the graph shakeable at file
        // granularity. `manualChunks` did the opposite here: it collapsed the
        // library into two blobs that the single entry imported eagerly, so a
        // bundler could never drop either.
        preserveModules: true,
        // Resolved against the CWD by Rollup, so anchor it explicitly —
        // a mismatch shifts every output under dist/libs/ and silently
        // breaks the exports subpaths, with the build still exiting 0.
        preserveModulesRoot: resolve(__dirname, 'libs'),
        entryFileNames: preservedModuleFileNames,
        chunkFileNames: preservedModuleFileNames,
        assetFileNames,
        exports: 'named',
        compact: true,
      },
      treeshake: treeshakeOptions,
    },
    sourcemap: false,
    minify: 'terser', // Use terser for better compression
    terserOptions,
    // Enable CSS optimization
    cssMinify: true,
    // Disable CSS code splitting to bundle all CSS into one file
    cssCodeSplit: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue'],
    exclude: ['maplibre-gl'], // Let users handle maplibre-gl optimization
  },
});
