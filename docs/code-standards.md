# Code Standards & Best Practices

## Project Standards

This document defines the code standards, conventions, and best practices used in vue3-maplibre-gl.

## TypeScript & Language

### Type Safety

- **Strict Mode**: All files compiled with TypeScript strict mode enabled
- **No `any`**: Avoid `any` type; use `unknown` with type guards if necessary
- **Generics**: Use generics for reusable, type-safe code (especially factory functions)
- **Type Imports**: Use `type` imports for type-only declarations

```typescript
// Good - a `type` import is erased at build time
import type { Map, LayerSpecification } from 'maplibre-gl';

export interface CreateLayerActions<T extends LayerSpecification> {
  layerSpec: T | null;
  mapInstance: Map | null;
}

// Avoid - a value import used only as a type keeps the module in the bundle
import { Marker } from 'maplibre-gl';

export interface MarkerActions {
  markerInstance: Marker | null;
}
```

### Naming Conventions

| Category               | Convention                               | Example                                          |
| ---------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Components**         | PascalCase                               | `Maplibre`, `GeoJsonSource`, `FillLayer`         |
| **Composables**        | camelCase with `use` prefix              | `useMaplibre`, `useFlyTo`, `useMapEventListener` |
| **Enums**              | PascalCase                               | `MapCreationStatus`, `EventListenerStatus`       |
| **Types/Interfaces**   | PascalCase                               | `MaplibreActions`, `CreateMaplibreActions`       |
| **Constants**          | UPPER_SNAKE_CASE                         | module-level constants, none currently in `libs` |
| **Status enums**       | `<Feature>Status` + values in kebab-case | `FlyStatus.NotStarted` = `'not-started'`         |
| **Boolean properties** | `is*`, `has*`, `can*`                    | `isMapReady`, `hasError`, `canAnimate`           |
| **Event handlers**     | `handle*` or `on*`                       | `handleMapClick`, `onLoad`                       |

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
// MapLibre's own camera methods are not promises — `map.flyTo()` returns the
// map. Await this package's composables instead, which resolve when the
// animation they started settles.
const { flyTo } = useFlyTo({ map: mapInstance });

try {
  await flyTo({ center: [0, 0] });
} catch (error) {
  logError('Animation failed:', error);
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

  // Return public API. Return the reactive container itself — a `ComputedRef`
  // or the ref — never `status.value`. Unwrapping here type-checks and then
  // freezes the field at its setup-time value, which is the bug v6 fixed.
  return {
    startOperation,
    isActive,
    status: computed(() => status.value),
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

Some composables accept either a props object or positional arguments, kept for
the pre-v5 call shape. Twelve carry them: `useZoomTo`, `useZoomIn`,
`useZoomOut`, `useRotateTo`, `useResetNorth`, `useResetNorthPitch`,
`useSnapToNorth`, `usePanBy`, `usePanTo`, `useJumpTo`,
`useFitScreenCoordinates` and `useMapReloadEvent`. Everything else — `useFlyTo`
and `useFitBounds` included — takes a props object only.

```typescript
export function useZoomTo(props: ZoomToProps): ZoomToActions;
export function useZoomTo(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions & { zoom: number },
): { zoomTo: (zoomVal: number, options?: AnimationOptions) => void };
export function useZoomTo(
  mapOrProps: MaybeRef<Nullable<Map>> | ZoomToProps,
  legacyOptions?: AnimationOptions & { zoom: number },
) {
  // The positional form is detected by the absence of a `map` key, so a props
  // object is never mistaken for a bare map ref.
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  // ...
}
```

Prefer the props object in new code. Do not add overloads to a new composable —
the two shapes exist to avoid breaking callers, not because both are wanted.

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

### Test Coverage

Coverage is a ratchet in `vitest.config.ts`, not a target: every threshold is
the number the suite actually reaches, so a change that lowers coverage on a
covered file fails CI. Raising a number after adding tests is expected;
lowering one needs a reason in the commit message.

The global floor is deliberately low (39% statements at the time of writing)
because most layer, source and control composables have no tests at all.
[`project-roadmap.md`](./project-roadmap.md) lists which ones. The useful
contribution is a test for anything on that list, since it raises the floor
permanently.

Factories carry the highest per-file thresholds, because they are the shared
implementation behind many composables — `createEventListenerComposable` and
`createCameraAnimation` sit near 90%.

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
import { computed, ref } from 'vue';

const mapCreationStatus = ref('idle');

// Good - one computed, reused wherever readiness is needed
const isMapReady = computed(() => mapCreationStatus.value === 'loaded');

function render() {
  if (isMapReady.value) console.log('draw');
}

// Avoid - the same comparison spelled out at every call site
function renderAgain() {
  if (mapCreationStatus.value === 'loaded') console.log('draw');
}
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
</style>
```

The package ships one shared rule in `style.css`, for `.maplibre-container`.
There is no theming variable layer — do not document one until it exists.
Since v6 this stylesheet carries only this package's rules; MapLibre's own
stylesheet is imported by the app.

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
import { ref } from 'vue';

const status = ref('not-attached');

// Explain WHY, not WHAT

function attachGood() {
  // Prevent duplicate event listeners via idempotent check
  if (status.value === 'attached') return;
}

function attachBad() {
  // Check if status is attached
  if (status.value === 'attached') return;
}
```

### Code blocks are compiled

`bun run docs:check` writes every TypeScript, JavaScript and Vue block in
`docs/` and both READMEs out as a real module and compiles it with `vue-tsc`
against `dist/`, resolving `vue3-maplibre-gl` the way an installed consumer's
bundler would. It runs in CI right after the build.

It reports one class of problem: **a name that does not exist** — an import the
package does not export, a property that is not on the type it is read from, an
option that is not in the options type. It deliberately does not report
assignability failures caused by inference widening example data
(`center: [0, 0]` in a `ref()` infers `number[]`, not `LngLatLike`), or names an
abridged example expects the surrounding application to own. `build/docs-snippets/reported-diagnostics.ts`
lists every code and the reason it is or is not reported.

A block that genuinely cannot compile can be opted out with an HTML comment on
the line above its fence:

```md
<!-- snippet-skip: quotes the v5 API on purpose -->
```

The reason is required, and a skipped block is the only documentation nothing
verifies — so the check prints the list on every run, and the list is currently
empty. Every code block in `docs/` and both READMEs compiles. Before adding a
skip, check whether the block is skippable for a fixable reason instead: a
before/after where only the "after" needs to be true belongs in prose plus one
compiled fence, and a fence labelled `ts` that holds template markup should be
labelled `html`.

The API reference lists each composable's return fields as a markdown table,
which is prose to a compiler — nothing stops a row naming a field that does not
exist, and rows like that have reached `master`. So every `Returns` table in
`docs/api/composables.md` is compiled too: one `type _ = Returned['field']` per
row, against the composable its section names. A row that names nothing real
fails on the row's own line.

The other direction is checked as well, once per composable: a field the
composable returns that no row documents fails with a line naming it. That runs
over the union of the rows that apply — a section documenting several
composables at once has a shared table and a bold-labelled one each
(`**\`usePanBy\`\*\*`), and neither alone is the full list for either — so the
labelled tables are what make those sections checkable rather than decorative.

A section is allowed to describe its return in a sentence instead — but only if
there is nothing to tabulate. That is the same completeness check with an empty
list of rows: `useDebouncedWatch` (which returns a stop function) passes, and a
composable returning an object of ten fields fails with a line naming each one.
Prose is for returns with no shape, not for returns whose shape is inconvenient
to type out.

A return that folds in another documented shape may say so instead of repeating
it, with a marker naming the source:

```markdown
<!-- returns-spread: MaplibreMethods -->
<!-- returns-spread: useMapEventListener -->
```

A type name resolves through the package's public surface; a `use…` name
resolves through that composable's return. Either way the abridgement stays a
claim the compiler holds to — only members of the named source are forgiven, so
a field belonging to neither the table nor the source still fails, and a source
that is misspelled or not exported fails outright. `useMaplibre` spreads in all
47 accessors and setters of `MaplibreMethods`; that is the case the marker
exists for, not a general way to quiet the check.

The `Type` column is checked too: the documented type and the real one must
each be assignable to the other. Mutual assignability rather than identity,
because the tables abridge on purpose — they leave off the trailing
`StyleSetterOptions` argument every style setter takes, and a function type with
fewer parameters is interchangeable with one that has more optional ones. It
still catches a wrong parameter or return type, and a wrong wrapper (`Ref`
documented for something that returns a `ComputedRef`).

Type names in that column resolve through the package's own public surface, so
a row naming a type the package does not export fails. That is the point: a
type a reader cannot import is a type the reference should not use.

Diagnostics in a generated check bypass the allowlist entirely. The allowlist
exists to tolerate hand-written examples, which lean on inference and on names
the surrounding application owns; a generated assertion has no such excuse, and
filtering one would let a mismatched type pass as an assignability failure.

The generated checks are also compiled a second time with `strictNullChecks`
on. The main project runs with `strict` off so hand-written examples are not
drowned in diagnostics about their own placeholders — but with it off,
`Foo | null` and `Foo` are the same type, which is exactly the mistake a
`Returns` table is likeliest to make. Generated assertions have no placeholders
to protect, so they get the stricter pass; hand-written blocks do not.

A generic row is checked inside a function that repeats the composable's own
type parameter list and instantiates it with those parameters, so a documented
`T` is abstract rather than `any` — and the documented letter is aliased to the
signature's, which is free to call it `Layer`. That is what caught
`useDebounce`'s `flush`, documented as `() => ReturnType<T> | undefined` when it
returns `void`; with `T` as `any` the two were mutually assignable and the row
passed. A generic letter in a row for a composable that takes no type
parameters still falls back to `any`, since there is nothing to instantiate.

The types reference is checked the same way. `docs/api/types.md` transcribes
`libs/types` by hand, and its fences used to compile only in the weakest sense:
an undefined name reads as `Cannot find name`, which the allowlist tolerates, so
the page could name types that no longer exist and pass. Each documented type is
now compared with the exported one — mutual assignability for a shape, member
names and values for an enum — and a type the package does not export fails on
its heading. That first run found seven wrong: `SourceStatus` with three
invented members, `MapCreationStatus` ending in `Disposed` instead of
`Destroyed`, `GeolocateEventTypes` naming `trackingstart` for an event MapLibre
calls `trackuserlocationstart`, `GeolocateSuccess` missing `target`, `ImageDatas`
listing a canvas and a video it does not take, `MaybeRef` documented but not
exported, and every layer style fence built on `Expression` when the export is
`Expressions`.

Links are resolved too: a target must name a file that exists, and an anchor
must name a heading on that page. The reference had linked
`/api/types#maplibremethods` for months to a page with no such heading, and
VitePress renders a dead anchor as an ordinary link that lands at the top of the
page.

Which pages get the table and completeness checks is not a list to maintain: any
page with a `Returns` heading gets them, because that heading is the page
claiming to document a return.

Component attributes in the Vue examples are checked separately, because an
extra attribute on a component is legal Vue — it falls through to the root
element, so `vue-tsc` compiles a misspelled prop without a word. Every
attribute an example puts on one of this package's components must be a
declared prop or emit, with two deliberate exceptions: `class`, `style`, `ref`
and the other universal attributes, and native DOM events, which fallthrough
makes real. That first run found nine wrong attributes across five pages,
including `source-id` on a component whose prop is `id` — in six examples.

<!-- names-skip: the two names the README advertised, which never existed -->

Names in prose are checked too. A name in a sentence or a heading is not a name
in a code block, which is how the README came to advertise `useBounds` and
`useZoom` on the page npm renders; neither has ever existed. Every backticked
`use…` name must be exported, except on the changelog and the migration guides,
whose job is to describe what the library no longer has. Write `useZoom*` for a
family, and the star is checked as a prefix. A paragraph that has to name
something because it does _not_ exist opts out with a marker carrying a reason,
`<!-- names-skip: … -->`, which ends at the next blank line — the paragraph
above this one uses it.

The instructions outside the type system are checked as well: a `bun run …`
must name a real package script, a `vue3-maplibre-gl/dist/…` path must be a
file the build emits, and an advertised total ("10 components, 38 composables")
must match what the package exports.

One thing it still cannot see: a block whose fence language is not `ts`, `js`
or `vue` is never compiled. The `bash` blocks are checked for the two things
above; the two `html` ones are genuinely HTML.

## Git & Commits

### Commit Message Format

```
<type>(<scope>): <emoji> <description>

<body>

<footer>
```

Types, and the changelog group each one lands in. `cliff.toml` is the source of
truth; a type missing from it is silently dropped from the changelog.

| Type       | Emoji | Changelog group                         |
| ---------- | ----- | --------------------------------------- |
| `feat`     | ✨    | Features                                |
| `fix`      | 🐛    | Bug Fixes                               |
| `perf`     | 🚀    | Performance                             |
| `refactor` | 📦    | Refactor                                |
| `docs`     | 📚    | Documentation                           |
| `test`     | 🚨    | Tests                                   |
| `build`    | 🛠    | Build — including dependency changes    |
| `ci`       | ⚙️    | CI                                      |
| `style`    | 💎    | Styles                                  |
| `revert`   | ⏪    | Revert                                  |
| `chore`    | ♻️    | skipped, never appears in the changelog |

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

- Prefer a deprecation cycle: warn in one major, remove in the next
- v6 did not get one. The composable return types were wrong rather than
  merely outdated — a status unwrapped at setup could not be deprecated into
  correctness, only replaced — so the break was immediate and documented in
  [the v6 migration guide](./guide/migration-v6.md) instead
- Any break, with or without a cycle, ships with a migration guide

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
