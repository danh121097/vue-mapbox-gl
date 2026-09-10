import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Vue 3 MapLibre GL',
  description:
    'Interactive maps for Vue 3 — 10 components and 38 composables for MapLibre GL JS, fully typed with TypeScript.',
  base: '/',
  ignoreDeadLinks: false,
  srcExclude: [
    'code-standards.md',
    'codebase-summary.md',
    'project-overview-pdr.md',
    'project-roadmap.md',
    'system-architecture.md',
  ],
  appearance: 'dark',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#10b981' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Vue 3 MapLibre GL' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Interactive maps for Vue 3 — 10 components and 38 composables for MapLibre GL JS, fully typed with TypeScript.',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  sitemap: {
    hostname: 'https://vue-maplibre-gl.pages.dev/',
  },

  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/components' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v6.1.1',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Migration from v5', link: '/guide/migration-v6' },
          { text: 'Migration from v4', link: '/guide/migration-v5' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Basic Usage', link: '/guide/basic-usage' },
            { text: 'Configuration', link: '/guide/configuration' },
            {
              text: 'Composables Overview',
              link: '/guide/composables-overview',
            },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'SSR / Nuxt', link: '/guide/ssr-nuxt' },
            { text: 'Migration from v5', link: '/guide/migration-v6' },
            { text: 'Migration from v4', link: '/guide/migration-v5' },
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
      { icon: 'github', link: 'https://github.com/danh121097/vue-maplibre-gl' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/vue3-maplibre-gl' },
    ],

    editLink: {
      pattern:
        'https://github.com/danh121097/vue-maplibre-gl/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message:
        'Released under the <a href="https://github.com/danh121097/vue-maplibre-gl/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>.',
      copyright: `Copyright © ${new Date().getFullYear()} - <a href="https://harrynguyen.work" target="_blank" rel="noopener noreferrer">Harry Nguyen</a>`,
    },
  },
});
