import { defineConfig } from 'vitepress';
import type { DefaultTheme } from 'vitepress/types/default-theme';

const nav: DefaultTheme.Config['nav'] = [
  {
    text: 'Guide',
    link: '/guide/'
  },
  {
    text: 'API',
    link: '/api/'
  },
  {
    text: 'Composables',
    link: '/composables/'
  }
];

const sidebar: DefaultTheme.Config['sidebar'] = {
  '/guide/': [
    {
      items: [
        { text: 'Installation', link: '/guide/index.md' },
        { text: 'Map', link: '/guide/map.md' },
        { text: 'Geo Controls', link: '/guide/geo-controls.md' },
        { text: 'Markers & Popups', link: '/guide/markers-and-popups.md' },
        { text: 'Layers & Sources', link: '/guide/layers-and-sources.md' }
      ]
    }
  ],
  '/api/': [
    {
      items: [
        { text: 'Map', link: '/api/index.md' },
        { text: 'Controls', link: '/api/controls.md' },
        { text: 'Markers', link: '/api/marker.md' },
        { text: 'Popups', link: '/api/popup.md' },
        { text: 'Layers', link: '/api/layers.md' }
      ]
    }
  ],
  '/composables/': [
    {
      items: [{ text: 'Composables', link: '/composables/index.md' }]
    }
  ]
};

export default defineConfig({
  title: 'Vue3-Mapbox',
  description: 'The features of Maplibre GL and Vue3 JS',
  themeConfig: {
    nav,
    sidebar,
    footer: {
      copyright: 'Copyright © 2023'
    }
  }
});
