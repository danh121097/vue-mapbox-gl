import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Vue MapLibre GL',
  description: 'Vue 3 components and composables for MapLibre GL JS',
  base: '/',
  ignoreDeadLinks: true,

  // Ensure default theme is used
  appearance: 'dark',
  lastUpdated: true,
  cleanUrls: true,

  // Vite configuration to ensure CSS is included
  vite: {
    ssr: {
      noExternal: ['vitepress'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
      cssCodeSplit: false,
    },
  },

  // Ensure CSS is properly included
  head: [
    ['meta', { name: 'theme-color', content: '#3c82f6' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/components' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Basic Usage', link: '/guide/basic-usage' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Components', link: '/api/components' },
            { text: 'Composables', link: '/api/composables' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Map', link: '/examples/basic-map' },
            { text: 'Markers', link: '/examples/markers' },
            { text: 'Layers', link: '/examples/layers' },
            { text: 'Controls', link: '/examples/controls' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/danh121097/vue-mapbox-gl' },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/vue3-maplibre-gl',
      },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Danh Nguyen',
    },
  },
});
