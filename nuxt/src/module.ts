import {
  defineNuxtModule,
  createResolver,
  addPlugin,
  addImports,
} from '@nuxt/kit';

export interface ModuleOptions {
  /** Auto-import the MapLibre GL and vue3-maplibre-gl stylesheets (default: true) */
  css?: boolean;
  /** Prefix for auto-imported composables (default: none) */
  prefix?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-maplibre-gl',
    configKey: 'maplibre',
    description:
      'Nuxt module for vue3-maplibre-gl with auto-import, SSR support, and full TypeScript',
    links: {
      documentation: 'https://github.com/danh121097/vue-maplibre-gl',
      repository: 'https://github.com/danh121097/vue-maplibre-gl',
    },
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    css: true,
    prefix: '',
  },
  async setup(options, nuxt) {
    const { resolve, resolvePath } = createResolver(import.meta.url);

    // Auto-import CSS. MapLibre's own stylesheet is no longer re-bundled into
    // the library's style.css, so both are pushed: upstream first, then this
    // package's container rules. Both stylesheets are dependencies of this
    // module, not of the consuming app, so they are resolved to absolute
    // paths from here — a bare specifier is resolved from the app root, which
    // under pnpm's isolated node_modules cannot see them at all.
    if (options.css) {
      nuxt.options.css.push(
        await resolvePath('maplibre-gl/dist/maplibre-gl.css'),
        await resolvePath('vue3-maplibre-gl/dist/style.css'),
      );
    }

    // Transpile vue3-maplibre-gl for SSR
    nuxt.options.build.transpile.push('vue3-maplibre-gl');

    // Exclude maplibre-gl from SSR bundle (requires WebGL)
    nuxt.options.vite.optimizeDeps ??= {};
    nuxt.options.vite.optimizeDeps.exclude ??= [];
    if (!nuxt.options.vite.optimizeDeps.exclude.includes('maplibre-gl')) {
      nuxt.options.vite.optimizeDeps.exclude.push('maplibre-gl');
    }

    // Add client-only plugin that registers components
    addPlugin({
      src: resolve('./runtime/plugins/maplibre-gl.client'),
      mode: 'client',
    });

    // Auto-import composables. This list is every `use*` the package exports
    // from its root; a name missing here is silently not auto-imported, which
    // looks to a consumer like the composable does not exist.
    const composables = [
      // Map instance
      'useCreateMaplibre',
      'useMaplibre',
      'useMaplibreConfig',
      // Layers
      'useCreateLayer',
      'useCreateFillLayer',
      'useCreateCircleLayer',
      'useCreateLineLayer',
      'useCreateSymbolLayer',
      'useLayer',
      // Sources
      'useCreateGeoJsonSource',
      'useGeoJsonSource',
      // Map objects
      'useCreateMarker',
      'useCreatePopup',
      'useCreateImage',
      // Controls
      'useGeolocateControl',
      // Events
      'useMapEventListener',
      'useLayerEventListener',
      'useGeolocateEventListener',
      'useMapReloadEvent',
      // Camera
      'useFlyTo',
      'useEaseTo',
      'useJumpTo',
      'useFitBounds',
      'useFitScreenCoordinates',
      'useCameraForBounds',
      'useZoomTo',
      'useZoomIn',
      'useZoomOut',
      'usePanBy',
      'usePanTo',
      'useRotateTo',
      'useResetNorth',
      'useResetNorthPitch',
      'useSnapToNorth',
      // Utilities
      'useDebounce',
      'useDebouncedRef',
      'useDebouncedWatch',
      'useLogger',
    ];

    addImports(
      composables.map((name) => ({
        name,
        as: options.prefix ? `${options.prefix}${name}` : name,
        from: 'vue3-maplibre-gl',
      })),
    );
  },
});
