import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@libs': resolve(__dirname, './libs'),
      '@libs/composables': resolve(__dirname, './libs/composables'),
      '@libs/enums': resolve(__dirname, './libs/enums'),
      '@libs/types': resolve(__dirname, './libs/types'),
      '@libs/components': resolve(__dirname, './libs/components'),
      '@libs/helpers': resolve(__dirname, './libs/helpers'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['libs/**/*.ts'],
      exclude: ['libs/**/__tests__/**', 'libs/test-utils.ts'],
      reporter: ['text-summary', 'json-summary'],
      /**
       * A ratchet, not a target. Every number below is the coverage the file
       * actually had when the gate went in, so the suite can only get better —
       * a change that drops coverage on a covered file fails the run.
       *
       * The per-file entries are the modules with real tests. The top-level
       * numbers are the floor for `libs/` as a whole, which is low because most
       * layer, camera and control composables still have no tests at all.
       *
       * Each number is rounded down a couple of points from the measured value.
       * Without that slack an entry that sits exactly on its measurement turns
       * any unrelated edit adding one uncovered line into a red build, which
       * would make the gate something to route around rather than keep.
       *
       * Raising a number after adding tests is expected. Lowering one needs a
       * reason in the commit message.
       */
      thresholds: {
        statements: 39,
        branches: 34,
        functions: 37,
        lines: 40,

        'libs/composables/event/createEventListenerComposable.ts': {
          statements: 88,
          branches: 86,
          functions: 88,
          lines: 90,
        },
        'libs/composables/event/useMapReloadEvent.ts': {
          statements: 74,
          branches: 71,
          functions: 79,
          lines: 75,
        },
        'libs/composables/layers/createLayerPropertySetters.ts': {
          statements: 88,
          branches: 83,
          functions: 98,
          lines: 93,
        },
        'libs/composables/layers/useCreateLayer.ts': {
          statements: 61,
          branches: 62,
          functions: 70,
          lines: 63,
        },
        'libs/composables/map/useCreateImage.ts': {
          statements: 64,
          branches: 43,
          functions: 84,
          lines: 65,
        },
        'libs/composables/map/useCreateMaplibre.ts': {
          statements: 42,
          branches: 30,
          functions: 54,
          lines: 45,
        },
        'libs/composables/map/useCreateMarker.ts': {
          statements: 37,
          branches: 37,
          functions: 44,
          lines: 40,
        },
        'libs/composables/map/useCreatePopup.ts': {
          statements: 39,
          branches: 42,
          functions: 46,
          lines: 41,
        },
        'libs/composables/map/useMaplibre.ts': {
          statements: 38,
          branches: 50,
          functions: 14,
          lines: 38,
        },
        'libs/composables/sources/useCreateGeoJsonSource.ts': {
          statements: 75,
          branches: 71,
          functions: 83,
          lines: 82,
        },
        'libs/composables/utils/createCameraAnimation.ts': {
          statements: 88,
          branches: 92,
          functions: 89,
          lines: 89,
        },
        'libs/composables/utils/useFitScreenCoordinates.ts': {
          statements: 61,
          branches: 51,
          functions: 70,
          lines: 63,
        },
        'libs/composables/event/useLayerEventListener.ts': {
          statements: 92,
          branches: 67,
          functions: 98,
          lines: 98,
        },
        'libs/composables/utils/useRotate.ts': {
          statements: 49,
          branches: 48,
          functions: 38,
          lines: 48,
        },
        'libs/composables/utils/useZoom.ts': {
          statements: 43,
          branches: 47,
          functions: 34,
          lines: 43,
        },
        'libs/composables/utils/usePan.ts': {
          statements: 31,
          branches: 28,
          functions: 25,
          lines: 32,
        },
        'libs/helpers/index.ts': {
          statements: 28,
          branches: 29,
          functions: 38,
          lines: 28,
        },
      },
    },
  },
});
