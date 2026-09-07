# Examples

Explore practical, production-ready examples of vue3-maplibre-gl v5 components and composables in action.

## Quick Start

### Installation

```bash
bun add vue3-maplibre-gl
# or
npm install vue3-maplibre-gl
```

### Import CSS

```typescript
// main.ts or in your component
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';
```

### Basic Usage

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 500px">
    <GeoJsonSource :data="geoData">
      <CircleLayer :style="circleStyle" />
    </GeoJsonSource>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Center' },
    },
  ],
});

const circleStyle = ref({
  'circle-radius': 6,
  'circle-color': '#007cbf',
});
</script>
```

## Available Examples

### 🗺️ [Basic Map](/examples/basic-map)

Create a simple interactive map with style switching and configuration options.

**Topics Covered**:

- Map initialization with options
- Style switching (OSM, satellite, etc.)
- Reactive property updates
- Event handling (load, click, zoom)
- Camera controls and state

**Key Composables**:

- `useCreateMaplibre()` - Map creation
- `useMaplibre()` - Map context access
- `useFlyTo()` - Smooth camera animation

### 📍 [Markers](/examples/markers)

Add interactive markers to your map with advanced features.

**Topics Covered**:

- Marker creation and positioning
- Draggable markers with event handling
- Marker popups with custom content
- Marker clustering
- Marker icons and styling
- Marker removal and updates

**Key Composables**:

- `useCreateMarker()` - Programmatic marker creation
- `useCreatePopup()` - Marker popups
- `useMapEventListener()` - Interaction events

**Key Components**:

- `<Marker />` - Marker component
- `<PopUp />` - Popup overlays

### 🎨 [Layers](/examples/layers)

Work with all layer types: Fill, Circle, Line, and Symbol layers.

**Topics Covered**:

- Fill layers for polygons with styling
- Circle layers for points with size/color
- Line layers for routes/boundaries
- Symbol layers for text/icons
- Layer painting and layout properties
- Reactive style updates
- Layer filtering by properties
- Layer z-order management

**Key Composables** (all with full type safety):

- `useCreateFillLayer()` - Fill layers
- `useCreateCircleLayer()` - Circle layers
- `useCreateLineLayer()` - Line layers
- `useCreateSymbolLayer()` - Symbol layers

**Key Components**:

- `<FillLayer />` - Fill layer component
- `<CircleLayer />` - Circle layer component
- `<LineLayer />` - Line layer component
- `<SymbolLayer />` - Symbol layer component

### 🎮 [Controls](/examples/controls)

Integrate navigation controls and geolocation features.

**Topics Covered**:

- Geolocation control initialization
- User location tracking
- Geolocation events and permissions
- Custom control positioning
- Control state management
- Error handling for location services

**Key Composables**:

- `useGeolocateControl()` - Programmatic geolocation
- `useGeolocateEventListener()` - Geolocate events

**Key Components**:

- `<GeolocateControls />` - Geolocation control

## Example Structure

Each example includes:

| Section        | Content                                  |
| -------------- | ---------------------------------------- |
| **Live Demo**  | Interactive map with full functionality  |
| **Code**       | Complete Vue component with explanations |
| **Features**   | Key capabilities highlighted             |
| **APIs**       | Links to relevant composables/components |
| **Variations** | Alternative approaches and patterns      |

## Common Patterns

### Data Updates

```typescript
const geoData = ref({ type: 'FeatureCollection', features: [] });

// Update data reactively
watch(
  () => selectedRegion.value,
  (region) => {
    const filtered = allFeatures.filter((f) => f.properties.region === region);
    geoData.value = { type: 'FeatureCollection', features: filtered };
  },
);
```

### Camera Animations

```typescript
const { flyTo } = useFlyTo({ map: mapInstance });

const animateToLocation = async (location) => {
  try {
    await flyTo({ center: location, zoom: 10 });
  } catch (error) {
    console.error('Animation failed:', error);
  }
};
```

### Event Handling

```typescript
const { isListenerAttached } = useMapEventListener({
  map: mapInstance,
  event: 'click',
  on: (e) => {
    console.log('Clicked at:', e.lngLat);
    // Get features at click point
    const features = mapInstance.value?.queryRenderedFeatures({
      layers: ['my-layer'],
    });
  },
});
```

### Layer Styling

```typescript
const { setStyle, setFilter } = useCreateCircleLayer({
  map: mapInstance,
  source: sourceId,
});

// Type-safe property updates
watch(
  () => settings.radius,
  (newRadius) => {
    setStyle({ 'circle-radius': newRadius, 'circle-color': '#088' });
  },
);

watch(
  () => filters.name,
  (name) => {
    setFilter(['in', 'name', ...name.split(',')]);
  },
);
```

## Running Examples Locally

### Using the Example App

Clone the repository and run the example app:

```bash
git clone https://github.com/danh121097/vue-maplibre-gl
cd vue-maplibre-gl/examples
bun install
bun dev
```

Then open the local URL shown in your terminal (usually localhost on port 5173).

### Copy & Paste

You can copy any example code and paste it into your Vue 3 project. All examples are standalone and include necessary imports.

## Best Practices

1. **Always handle map readiness** before operations

   ```typescript
   watch(isMapReady, () => {
     // Map is interactive now
   });
   ```

2. **Use type-safe layer composables** for compile-time validation

   ```typescript
   const { setStyle } = useCreateFillLayer({ map, source });
   // setStyle only accepts FillLayerStyle properties
   ```

3. **Await camera animations** for sequential operations

   ```typescript
   await flyTo({ center: [0, 0], zoom: 10 });
   // Camera animation complete
   ```

4. **Clean up listeners** (automatic with composables)

   ```typescript
   const { removeListener } = useMapEventListener({
     map: mapInstance,
     event: 'click',
     on: handler,
   });
   // Removed on component unmount automatically
   ```

5. **Use reactive data** for real-time updates
   ```typescript
   const geoData = ref({...});
   watch(() => externalData, () => {
     geoData.value = transformedData;
   });
   ```

## Advanced Topics

### Performance Optimization

- Use `GeoJsonSource` with clustering for large datasets
- Filter data on the backend before sending
- Use `watch` with debounce for frequent updates
- Optimize GeoJSON complexity (simplify geometries)

### State Management

- Use `register` callback for Pinia/Vuex integration
- Store map state in application state management
- Sync URL params with map camera position

### Custom Controls

- Build on top of `useMaplibre()` composable
- Listen to map events with `useMapEventListener()`
- Update UI based on map state reactively

## Troubleshooting

### Map Not Showing

- **Check**: Container has height (e.g., `style="height: 500px"`)
- **Check**: both stylesheets are imported (`maplibre-gl/dist/maplibre-gl.css` and `vue3-maplibre-gl/dist/style.css`)
- **Check**: MapOptions includes valid `style` URL

### Events Not Firing

- **Check**: Listener attached before map ready
- **Check**: Event name is correct (see MapLibre GL docs)
- **Check**: Map instance is valid and ready

### Data Not Updating

- **Check**: Using `ref()` for reactive data
- **Check**: Updating `geoData.value` not reassigning
- **Check**: Source ID matches layer sourceId

## More Resources

- [Component API Reference](/api/components)
- [Composables API Reference](/api/composables)
- [Type Reference](/api/types)
- [Getting Started Guide](/guide/getting-started)
- [SSR/Nuxt Guide](/guide/ssr-nuxt)
- [GitHub Repository](https://github.com/danh121097/vue-maplibre-gl)

2. Install dependencies: `yarn install`
3. Start the development server: `yarn dev`
4. Navigate to the examples section

## Contributing Examples

Have a great example to share? We welcome contributions! Please:

1. Fork the repository
2. Create a new example file in the appropriate category
3. Follow the existing example format
4. Submit a pull request

## Need Help?

- Check the [API documentation](/api/components) for component details
- Review [composables documentation](/api/composables) for advanced functionality
- Visit our [GitHub repository](https://github.com/danh121097/vue-maplibre-gl) for issues and discussions
