# Changelog

## v6.1.1

### 🐛 Bug Fixes

- Install without bun's cache when publishing the module

- Rebuild layers after an in-place style diff

## v6.1.0

### ✨ Features

- Ship an opt-in stylesheet that carries MapLibre's rules

### 🐛 Bug Fixes

- Generate the playground types before the module build

- Restore the major-tracking vue3-maplibre-gl range

### 📚 Documentation

- Reconcile the maintainer docs with the 6.0.4 release

## v6.0.4

### 🐛 Bug Fixes

- Ship the navbar logo and correct the test counts

- Repair the dead CDN and MapLibre API links

- Drop the private tile server and widen the count check

### 📚 Documentation

- Correct stale version references across the docs

### 🚨 Tests

- Cover the "N tests across M files" spelling

### 🛠 Build

- Pin prettier to an exact 3.6.2

## v6.0.3

### 📚 Documentation

- Fix the LICENSE badge link and the composables example

## v6.0.2

### ⚙️ CI

- Run deploy-docs and release only on master pushes

### ✨ Features

- Compile every docs code block against the built package

### 🐛 Bug Fixes

- Infer the handler's event type from the event name

- Stop coalescing minzoom and maxzoom past their defaults

- Stop a unit test from reading build output the Test step lacks

### 💎 Styles

- Format the maintainer docs Prettier had never seen

### 📚 Documentation

- Show the one-package install where it actually works

- Use one install command everywhere

- Give every page the same four install tabs and counts

- Track the five maintainer docs and reconcile them to v6

- Correct the standards and architecture docs against source

- Remove documented APIs that do not exist

- Correct component defaults and complete the event tables

- Correct the names the compiler found wrong

- Compile the 24 blocks that were opted out of the check

- Compile the last two skipped blocks

- Table every return the reference described in prose

- Name the callback props GeolocateControls actually has

- Point both npm pages at docs that exist

### 🚨 Tests

- Compile the Returns tables in the API reference

- Check the Type column of every Returns row

- Check that every returned field has a Returns row

- Compare the types reference with the real types

- Check prose names, component attributes and instructions

- Let prose opt out of the name check with a reason

- Check a generic row against a real type parameter

- Compile the Parameters, Props and Events tables

- Compile the Slots, Default and prop/emit-name claims

- Reach the ten Parameters tables no pattern matched

- Count what every doc check actually reaches

- Check the advertised size of the test suite

### 🛠 Build

- Refresh the lockfile against the published vue3-maplibre-gl

## v6.0.1

Republish of v6.0.0. The v6.0.0 tarball on npm was built before `maplibre-gl`
moved to `peerDependencies` and still lists it under `dependencies`. npm does
not allow republishing a version, so the corrected build ships as v6.0.1 and
v6.0.0 is deprecated. No source change beyond that.

## v6.0.0

### ⚙️ CI

- Merge deploy-docs + release into single CI/CD workflow

- Assert the published output contract

### ✨ Features

- Auto-update changelog on each release via git-cliff

### 🐛 Bug Fixes

- Stop 'project already exists' error noise in deploy-docs

- Return reactive containers instead of dead snapshots

- Stop destroying the component before it mounts

- Own image lifecycle in an effect scope

- Hand register read-only refs

- Push both stylesheets and declare the real dependencies

- Attach listeners when the target arrives after the composable

- Keep the map usable after a post-load runtime error

- Settle each animation on its own event, not the next one

- Auto-import every composable the package exports

### 💎 Styles

- Polish footer, link MIT License + Harry Nguyen site

- Use dynamic current year in footer copyright

- Update title and description in VitePress config

- Format the tree and gate format:check in CI

### 📚 Documentation

- Include Cloudflare in Nuxt SSR deployment examples

- Document all missing composables and event-handler types

- Add the v5 to v6 migration guide

- Import MapLibre's stylesheet and runtime from their own paths

- Record the phase 3 reactivity and API changes

- Correct composable signatures that contradicted the code

- Fix the signatures the first reconciliation pass missed

- Complete the layer tables and fix the geolocate event names

- Document the error, options and camera behaviour changes

- Rewrite against the repository's actual state

### 📦 Refactor

- Remove the two unused computed helpers

- Remove unreachable states and dead guards

### 🚀 Performance

- Emit preserved modules and unpin the MapLibre runtime

- Drop deep watching from eight prop watchers

- Stop map watchers from triggering themselves

### 🚨 Tests

- Cover the reactivity contract and image lifecycle

- Cover listener hygiene, lifecycle, and gate coverage

- Model MapLibre's layer-scoped listener overload in the mock

- Raise the ratchet to the coverage the new tests reach

### 🛠 Build

- Bump actions to Node24 majors to clear deprecation warnings

- Keep test declarations out of the package

- Ship the version in package.json

- Drop nanoid, a devDependency imported at runtime

- Stop shipping orphan chunks and unresolvable Nuxt imports

- Point the module's docs link at the documentation site

- Set nuxt-maplibre-gl to 2.0.0 and stop guessing the bump

- Make maplibre-gl a peer dependency

## v5.0.0

Major internal refactor — zero breaking API changes.

### Architecture
- **DRY factory patterns**: Event listeners, camera animations, and layer composables consolidated via shared factories (59% LOC reduction)
- **Event listener factory**: Adapter pattern for map, layer, and geolocate events
- **Camera animation factory**: Shared promise-wrapping with opt-in timeout support
- **Layer property setter factory**: Typed generics preserving value types

### Performance
- Fixed event listener memory leak in Maplibre.vue
- Removed private `map._loaded` API — replaced with `map.isStyleLoaded()`
- Shallow equality default in `useOptimizedComputed` (reduced GC pressure)

### Type Safety
- New consumer-facing event handler types (`MapClickHandler`, `LayerClickHandler`, etc.)
- JSDoc for `Expressions` and `StyleFunction` type limitations
- Exported `EventListenerStatus`, `AnimationStatus` enums

### SSR Compatibility
- All `window.setTimeout` replaced with SSR-safe `setTimeout`
- `isBrowser` guard for map/marker/popup creation
- Works with Nuxt SSR/SSG out of the box

### Component Consistency
- All 4 layer components forward `register` callback consistently
- Verified `shallowRef` + `markRaw` for all MapLibre object storage

### Testing
- Added vitest framework with 27 unit tests for factory functions
- Test coverage for event listeners, camera animations, and layer setters

### Build
- Migrated from yarn to bun package manager
- Updated `sideEffects` for better tree-shaking
- Upgraded VitePress docs to v1.6.4

## v4.2.3

- Documentation updates for MapLibre integration

## v4.2.2

- Optimized layer and source handling with `markRaw`
