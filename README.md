# Vue MapLibre GL

[![npm](https://img.shields.io/npm/v/vue3-maplibre-gl)](https://www.npmjs.com/package/vue3-maplibre-gl) [![Downloads](https://img.shields.io/npm/dt/vue3-maplibre-gl)](https://www.npmjs.com/package/vue3-maplibre-gl) [![Stars](https://img.shields.io/github/stars/danh121097/vue-mapbox-gl?style=flat-square)](https://github.com/danh121097/vue-mapbox-gl/stargazers) [![License](https://img.shields.io/npm/l/vue3-maplibre-gl)](https://github.com/danh121097/vue-mapbox-gl/blob/main/LICENSE)

> Vue 3 components and composables for MapLibre GL JS - Build interactive maps with ease

A comprehensive Vue 3 component library for MapLibre GL JS that provides an intuitive, reactive way to build interactive maps in your Vue applications.

## ✨ Features

- 🗺️ **Interactive Maps** - Create beautiful, interactive maps with MapLibre GL JS
- 🧩 **Component-Based** - Use Vue components for markers, layers, controls, and more
- 🎯 **TypeScript Support** - Full TypeScript support with comprehensive type definitions
- 🚀 **Performance** - Optimized for performance with efficient rendering
- 🔧 **Composables** - Powerful composables for map interactions and state management
- 📱 **Responsive** - Mobile-friendly maps that work across all devices

## 📦 Installation

### Using Yarn (Recommended)

```bash
yarn add vue3-maplibre-gl maplibre-gl
```

### Using npm

```bash
npm install vue3-maplibre-gl maplibre-gl
```

### Using pnpm

```bash
pnpm add vue3-maplibre-gl maplibre-gl
```

## 🚀 Quick Start

```vue
<template>
  <MapLibreMap
    :map-style="mapStyle"
    :center="[0, 0]"
    :zoom="2"
    style="height: 400px"
  >
    <MapLibreMarker :lng-lat="[0, 0]">
      <div class="marker">📍</div>
    </MapLibreMarker>
  </MapLibreMap>
</template>

<script setup>
import { MapLibreMap, MapLibreMarker } from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapStyle = 'https://demotiles.maplibre.org/style.json';
</script>
```

## 📚 Documentation

- **[Getting Started](https://danh121097.github.io/vue-mapbox-gl/guide/getting-started)** - Learn the basics
- **[Installation Guide](https://danh121097.github.io/vue-mapbox-gl/guide/installation)** - Detailed setup instructions
- **[API Reference](https://danh121097.github.io/vue-mapbox-gl/api/components)** - Complete component documentation
- **[Examples](https://danh121097.github.io/vue-mapbox-gl/examples/)** - Live examples and demos

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/danh121097/vue-mapbox-gl.git
cd vue-mapbox-gl

# Install dependencies
yarn install

# Start development server
yarn dev

# Build the library
yarn build

# Run documentation
yarn docs:dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- Inspired by the Vue.js ecosystem and community

## 📞 Support

- 📖 [Documentation](https://danh121097.github.io/vue-mapbox-gl/)
- 🐛 [Issues](https://github.com/danh121097/vue-mapbox-gl/issues)
- 💬 [Discussions](https://github.com/danh121097/vue-mapbox-gl/discussions)
