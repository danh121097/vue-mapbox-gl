# Code Standards & Best Practices

## Project Standards

This document defines the code standards, conventions, and best practices used in vue3-maplibre-gl v5.

## TypeScript & Language

### Type Safety

- **Strict Mode**: All files compiled with TypeScript strict mode enabled
- **No `any`**: Avoid `any` type; use `unknown` with type guards if necessary
- **Generics**: Use generics for reusable, type-safe code (especially factory functions)
- **Type Imports**: Use `type` imports for type-only declarations

```typescript
// Good
import type { Map, LayerSpecification } from 'maplibre-gl';
export interface CreateLayerActions<T extends LayerSpecification> { ... }

// Avoid
import { Map } from 'maplibre-gl';  // Only for type, use type import
```

### Naming Conventions

| Category               | Convention                  | Example                                          |
| ---------------------- | --------------------------- | ------------------------------------------------ |
| **Components**         | PascalCase                  | `Maplibre`, `GeoJsonSource`, `FillLayer`         |
| **Composables**        | camelCase with `use` prefix | `useMaplibre`, `useFlyTo`, `useMapEventListener` |
| **Enums**              | PascalCase                  | `MapCreationStatus`, `EventListenerStatus`       |
| **Types/Interfaces**   | PascalCase                  | `MaplibreActions`, `CreateMaplibreActions`       |
| **Constants**          | UPPER_SNAKE_CASE            | `MAP_DEFAULT_ZOOM`, `ANIMATION_TIMEOUT`          |
| **Private variables**  | Leading underscore          | `_internalState`, `_cachedData`                  |
| **Boolean properties** | `is*`, `has*`, `can*`       | `isMapReady`, `hasError`, `canAnimate`           |
| **Event handlers**     | `handle*` or `on*`          | `handleMapClick`, `onLoad`                       |

### Imports Organization

```typescript
// 1. Vue imports
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 2. External library imports
import type { Map, MapMouseEvent } from 'maplibre-gl';

// 3. Internal imports - organized by layer
import { useLogger } from '@libs/composables';
import { MapCreationStatus } from '@libs/enums';
import type { CreateMaplibreActions } from '@libs/types';
import { isBrowser } from '@libs/helpers';
```

## Component Development

### Component Structure

```vue
<script lang="ts" setup>
// 1. Imports (organized)
// 2. Interfaces/types for this component
// 3. Props interface
// 4. Emits interface
// 5. Reactive state
// 6. Computed properties
// 7. Watchers
// 8. Lifecycle hooks
// 9. Methods
</script>

<template>
  <!-- Template with semantic HTML -->
</template>

<style scoped>
/* Component styles */
</style>
```

### Props & Emits

```typescript
interface MyComponentProps {
  /** Description of prop. Type hint for IDE. */
  required: string;

  optional?: number;

  /** Callback registration */
  register?: (actions: MyActions) => void;
}

interface MyEmits {
  (e: 'register', actions: MyActions): void;
  (e: 'load', value: number): void;
  (e: 'error', error: Error): void;
}

const props = withDefaults(defineProps<MyComponentProps>(), {
  optional: 0,
});

const emit = defineEmits<MyEmits>();
```

### Slot Usage

Always document slots:

```typescript
interface Slots {
  default(): any;
  loading(): any;
  error(props: { error: Error }): any;
}
```

### Reactive State Management

```typescript
// Use shallowRef for MapLibre objects (no unwanted Vue tracking)
const mapInstance = shallowRef<Map | null>(null);

// Use ref for primitives/arrays
const isReady = ref(false);

// Use computed for derived state
const mapStatus = computed(() => {
  if (!mapInstance.value) return 'not-initialized';
  return isReady.value ? 'ready' : 'loading';
});

// Use markRaw for non-Vue objects
const geolocate = markRaw(new GeolocateControl());
```

### Lifecycle Patterns

```typescript
// 1. Setup state
const container = ref<HTMLElement>();
const { mapInstance, isReady } = useCreateMaplibre(container, style);

// 2. Monitor readiness
watchEffect(() => {
  if (!isReady.value) return;
  // Map is ready, initialize child components
});

// 3. Cleanup automatically (onUnmounted)
// All listeners/watchers cleaned up by framework
```

### Error Handling

```typescript
try {
  // Operation that might fail
  await mapInstance.value?.flyTo({ center: [0, 0] });
} catch (error) {
  // Handle error
  console.error('Animation failed:', error);
  // Don't rethrow; handle gracefully
}
```

## Composable Development

### Composable Structure

```typescript
/**
 * Composable description and purpose
 * @param map - Map instance ref
 * @param handler - Event handler function
 * @returns Object with methods and state
 */
export function useMyComposable(
  map: MaybeRef<Nullable<Map>>,
  handler: (data: any) => void,
) {
  const { log, logError } = useLogger(debug);

  // State
  const status = ref<Status>(Status.Idle);

  // Computed
  const isActive = computed(() => status.value === Status.Active);

  // Methods
  function startOperation() {
    try {
      // Implementation
    } catch (error) {
      logError('Error:', error);
      status.value = Status.Error;
    }
  }

  // Lifecycle
  onUnmounted(() => {
    // Cleanup
  });

  // Return public API
  return {
    startOperation,
    isActive,
    status: readonly(status),
  };
}
```

### Composable Return Types

```typescript
// Define explicit return interface
interface UseMaplibreResult {
  mapInstance: ComputedRef<Map | null>;
  // State is returned as the reactive container, never unwrapped. Returning
  // `someRef.value` here type-checks against `boolean` and silently freezes
  // the field at its setup-time value — the defect v6 exists to fix.
  isMapReady: ComputedRef<boolean>;
  isMapLoading: ComputedRef<boolean>;
  setCenter: (center: LngLatLike) => void;
}

export function useMaplibre(): UseMaplibreResult {
  // Implementation
}
```

### Composable Options Pattern

```typescript
// Support both object and separate parameters
export function useFlyTo(
  map: MaybeRef<Map | null>,
  options?: Partial<CameraOptions>,
): FlyToResult;
export function useFlyTo(props: {
  map: MaybeRef<Map | null>;
  options?: Partial<CameraOptions>;
}): FlyToResult;
export function useFlyTo(
  mapOrProps: MaybeRef<Map | null> | { map: MaybeRef<Map | null> },
  options?: any,
) {
  const { map, ...opts } =
    typeof mapOrProps === 'object' && !('value' in mapOrProps)
      ? mapOrProps
      : { map: mapOrProps, ...options };

  // Implementation
}
```

## Factory Functions

### Factory Pattern Guidelines

Factory functions eliminate code duplication for similar operations:

```typescript
/**
 * Generic factory for creating event listener composables
 * @param config - Event listener configuration
 * @returns Event listener actions
 */
export function createEventListenerComposable<TTarget>(
  config: EventListenerConfig<TTarget>,
): EventListenerActions {
  // Shared implementation

  function attachListener() {
    // Generic attachment logic
    config.adapter.attach(target, config.event, handler);
  }

  function removeListener() {
    // Generic removal logic
    config.adapter.detach(target, config.event, handler);
  }

  return { attachListener, removeListener, isAttached, status };
}
```

### Adapter Pattern (for factories)

```typescript
// Define adapter interface
interface EventListenerAdapter<TTarget> {
  attach: (target: TTarget, event: string, handler: Callback) => void;
  detach: (target: TTarget, event: string, handler: Callback) => void;
  validate?: (target: TTarget) => boolean;
}

// Implement for different targets
const mapAdapter: EventListenerAdapter<Map> = {
  attach: (map, event, handler) => map.on(event as any, handler),
  detach: (map, event, handler) => map.off(event as any, handler),
  validate: (map) => !!map,
};

const layerAdapter: EventListenerAdapter<Map> = {
  attach: (map, event, handler) => map.on(event as any, 'layer', handler),
  detach: (map, event, handler) => map.off(event as any, 'layer', handler),
  validate: (map) => map.getLayer('layer-id') !== undefined,
};
```

## Testing

### Test Organization

```
libs/composables/
  event/
    __tests__/
      create-event-listener-composable.test.ts
```

### Test Patterns

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('createEventListenerComposable', () => {
  let target: MockTarget;
  let config: EventListenerConfig<MockTarget>;

  beforeEach(() => {
    target = createMockTarget();
    config = {
      target: () => target,
      event: 'click',
      on: vi.fn(),
      adapter: mockAdapter,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should attach listener on mount', () => {
    const { attachListener } = createEventListenerComposable(config);
    attachListener();
    expect(target.on).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should be idempotent when attaching', () => {
    const { attachListener } = createEventListenerComposable(config);
    attachListener();
    attachListener(); // Call twice
    expect(target.on).toHaveBeenCalledTimes(1); // Only called once
  });

  it('should clean up listeners on unmount', () => {
    const { removeListener } = createEventListenerComposable(config);
    removeListener();
    expect(target.off).toHaveBeenCalled();
  });
});
```

### Test Coverage Goals

- Factory functions: 100% coverage
- Public composables: 80%+ coverage
- Components: 60%+ coverage (integration tests)
- Edge cases and error paths: Explicitly tested

## Performance

### Memory Management

```typescript
// Good - Use shallowRef for MapLibre objects
const mapInstance = shallowRef<Map | null>(null);

// Good - Use markRaw to prevent Vue tracking
const geolocate = markRaw(new GeolocateControl());

// Avoid - Deep reactivity on native objects
const mapInstance = ref(mapLibreInstance); // Unnecessary tracking
```

### Computed Properties

```typescript
// Good - Reuse computed results
const isMapReady = computed(() => mapCreationStatus.value === 'loaded');

// Avoid - Redundant computations
if (mapCreationStatus.value === 'loaded') { ... }  // Hard to optimize
```

### Watchers & Effects

```typescript
// Good - Specific dependencies
watch(
  () => props.center,
  (newCenter) => {
    mapInstance.value?.setCenter(newCenter);
  },
);

// Avoid - Deep watching entire objects
watch(
  () => props,
  (newProps) => {
    // Called on any prop change
  },
  { deep: true },
);
```

## CSS & Styling

### Component Styles

```vue
<style scoped>
/* Always use scoped styles */
.maplibre-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Use CSS custom properties for theming */
:root {
  --maplibre-primary: #088;
  --maplibre-error: #f56565;
  --maplibre-border: 1px solid #e2e8f0;
}
</style>
```

### No Style Conflicts

- Always use `.maplibre-*` class prefix
- Avoid global style pollution
- Document style dependencies
- Extract shared styles to `style.css`

## Documentation

### JSDoc/TSDoc Conventions

```typescript
/**
 * Primary description in one line
 *
 * More detailed description if needed. Explain the purpose,
 * common use cases, and any important caveats.
 *
 * @param map - The MapLibre instance
 * @param handler - Callback when event fires
 * @param options - Additional animation options
 * @returns Object with methods and state
 *
 * @example
 * const { flyTo } = useFlyTo({ map: mapInstance });
 * await flyTo({ center: [0, 0], zoom: 10 });
 *
 * @see useEaseTo
 * @see createCameraAnimation
 */
```

### Comment Guidelines

```typescript
// Explain WHY, not WHAT
// Good
// Prevent duplicate event listeners via idempotent check
if (status.value === 'attached') return;

// Bad
// Check if status is attached
if (status.value === 'attached') return;
```

## Git & Commits

### Commit Message Format

```
<type>(<scope>): <emoji> <description>

<body>

<footer>
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting/style
- `refactor`: Code refactor
- `perf`: Performance
- `test`: Tests
- `chore`: Tooling/deps

Example:

```
✨feat(composables): add animation timeout support

- Camera animations now support optional timeout
- Prevents hanging promises on long animations
- Closes #123
```

### Commit Best Practices

- One logical change per commit
- Focused scope (one component/feature)
- No unrelated changes
- Clear, descriptive messages
- Reference issues/PRs when applicable

## Security

### Input Validation

```typescript
// Validate user input before passing to MapLibre
function validateLngLat(value: any): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('Invalid lngLat format');
  }
  const [lng, lat] = value;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new Error('Invalid coordinates');
  }
  return [lng, lat];
}
```

### XSS Prevention

```typescript
// Never directly insert user content into DOM
// BAD
element.innerHTML = userContent;

// GOOD
element.textContent = userContent; // Escaped
element.appendChild(domElement); // Safe DOM element
```

### Data Handling

- Don't log sensitive data
- Sanitize URLs before loading
- Validate GeoJSON data structure
- Don't expose server errors to users

## Dependencies

### Version Management

- Keep dependencies up to date
- Pin major versions for stability
- Test before upgrading
- Document breaking changes

### MapLibre GL JS

- Current: `^5.6.1`, declared as a peer dependency so the app owns the version
- Never directly call private APIs (e.g., `map._loaded`)

## Internationalization

Not currently implemented, but planned for future versions.

## Accessibility

### WCAG Compliance

- Use semantic HTML
- Provide keyboard navigation (inherited from MapLibre GL)
- Include ARIA attributes where needed
- Test with screen readers

### Examples

```vue
<button type="button" aria-label="Zoom in" @click="zoomIn">
  +
</button>
```

## Browser Support

| Browser | Version | Support          |
| ------- | ------- | ---------------- |
| Chrome  | 90+     | ✅ Full          |
| Firefox | 88+     | ✅ Full          |
| Safari  | 15+     | ✅ Full          |
| Edge    | 90+     | ✅ Full          |
| IE 11   | -       | ❌ Not supported |

## API Stability

### Semantic Versioning

- **Major** - Breaking API changes. A dependency moving to `peerDependencies`
  counts, which is why v6 was a major.
- **Minor** - New features, backward compatible
- **Patch** - Bug fixes only

### Deprecation Policy

- Deprecated features supported for 2 major versions
- Clear deprecation warnings with migration guides
- Removed in next major version

## Code Review Standards

### PR Review Checklist

- [ ] Code follows standards
- [ ] Tests passing and coverage adequate
- [ ] TypeScript no errors
- [ ] ESLint no errors
- [ ] Documentation updated
- [ ] No breaking changes (unless major version)
- [ ] Performance impact evaluated

### Review Process

1. Author creates PR with clear description
2. Automated checks run (tests, lint, types)
3. Peer review (1-2 reviewers)
4. Requested changes addressed
5. Approved and merged

## Continuous Improvement

- Review code standards quarterly
- Gather developer feedback
- Update standards based on community best practices
- Share knowledge and patterns with team
