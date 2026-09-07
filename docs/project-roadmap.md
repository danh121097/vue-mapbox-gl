# Project Roadmap

Maintainer-facing planning notes. Excluded from the published site via
`srcExclude` in `docs/.vitepress/config.ts`, so it can stay blunt about what is
unfinished.

Everything under "Current state" and "Known gaps" is checked against the
repository. Everything under "Candidates" is a proposal with no committed date —
this project has no release schedule, and inventing one here only produces a
document that is wrong a month later.

## Current state

**v6.0.1 is the published latest.** v6.0.0 was published and then deprecated: it was
built before `maplibre-gl` moved to `peerDependencies`, so its manifest still
declared the runtime as a direct dependency.

|             |                                                           |
| ----------- | --------------------------------------------------------- |
| Components  | 10                                                        |
| Composables | 38, all exported from the package root                    |
| Tests       | 107 across 19 files                                       |
| Coverage    | 41% statements / 36% branches / 39% functions / 42% lines |
| Nuxt module | `nuxt-maplibre-gl` 2.0.0, published                       |

Coverage is enforced as a ratchet in `vitest.config.ts`: every threshold is the
number a file actually reached, so a change that lowers it fails CI. The global
figure is low because most layer, source and control composables have no tests
at all — see Known gaps.

## What v6 changed

Behavioural changes are documented for consumers in
[the v6 migration guide](./guide/migration-v6.md). In short:

- **Composables return refs.** v5 unwrapped its reactive state once in the
  return object, so every status a consumer read was frozen at setup. This is
  the reason v6 is a major release.
- **A post-load `error` no longer unmounts the map.** Any error used to be
  fatal, so a tile 404 tore down every child component.
- **Camera calls settle on their own animation.** Calls shared the map's
  movement events, so an interrupted ease resolved whichever promise was
  waiting.
- **Layer and map-event listeners attach when their target arrives.** A
  listener registered before its layer existed was never attached.
- **Stylesheets separated.** The package ships only its own rules; MapLibre's
  stylesheet is imported the way MapLibre documents it.
- **MapLibre runtime moved to `vue3-maplibre-gl/maplibre`**, so importing one
  component no longer pins the whole upstream runtime into the module graph.
- **`maplibre-gl` is a peer dependency**, guaranteeing a single shared copy of
  the runtime.

## Known gaps

Verified, not aspirational.

### Untested modules

These have no test file. The layer composables are the largest hole — they carry
the property-setter and lifecycle logic that the v6 fixes touched.

| Area      | Modules                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Layers    | `useCreateFillLayer`, `useCreateCircleLayer`, `useCreateLineLayer`, `useCreateSymbolLayer`, `layerStyleConfig` |
| Map       | `useLayer`, `useGeoJsonSource`, `useMaplibreConfig`                                                            |
| Events    | `useMapEventListener`, `useGeolocateEventListener`                                                             |
| Controls  | `useGeolocateControl`                                                                                          |
| Camera    | `useFlyTo`, `useEaseTo`, `useJumpTo`, `useBounds`                                                              |
| Utilities | `useDebounce`, `useLogger`                                                                                     |

`useFlyTo` / `useEaseTo` / `useJumpTo` are partly exercised through
`createCameraAnimation`'s tests, but nothing pins their own option handling.

### Other

- **No integration test runs a real map.** Every test uses a hand-written mock,
  so a wrong assumption about MapLibre's behaviour is invisible until a
  consumer hits it. The camera event bugs fixed in v6 were exactly this.
- **No expression type hints.** MapLibre style expressions are typed as loose
  arrays; a malformed expression fails at runtime.
- **UMD build externalizes `maplibre-gl`,** so the CDN snippet needs the global
  `maplibregl` script loaded first. Documented, but a footgun.
- **No benchmark backs any performance claim.** The maintainer docs now state
  only measured bundle sizes and describe what the code does, because the
  figures they used to assert (frame rates, memory ceilings, adoption numbers)
  had nothing measuring them.

## Candidates for 6.x

Backward-compatible work, roughly in the order it would pay off.

1. **Tests for the four layer composables and `useLayer`.** Largest untested
   surface, and the one v6 changed most.
2. **A browser-based smoke test** (one real map, one real style) to catch the
   class of defect the mocks cannot.
3. **Expression builder helpers** with typed operators, replacing raw arrays at
   call sites that want type safety.
4. **GeoJSON clustering helpers** — MapLibre supports clustering natively; this
   package exposes no ergonomic wrapper for cluster events and expansion.
5. **Sprite / icon management composable.** `useCreateImage` handles one image;
   nothing helps with a sprite sheet.

## Candidates for 7.0

Only breaking work belongs here. Nothing is committed.

- **Reconsider the status-enum surface.** Every composable exports its own
  `*Status` enum plus boolean mirrors; a single shared shape would be smaller to
  learn, and cannot change without a major.
- **Consolidate the four layer composables** onto `useCreateLayer` with a
  discriminated type, if the tests in 6.x show the wrappers add nothing.
- **Drop the UMD build** if usage data does not justify maintaining a second
  build pass and its CSS-ordering hazard.

## Compatibility

Current declared support, from `package.json`:

| Dependency    | Range    | Kind                            |
| ------------- | -------- | ------------------------------- |
| `vue`         | `^3.0.0` | peer                            |
| `maplibre-gl` | `^5.6.1` | peer                            |
| `typescript`  | `^5.4.5` | dev — build and type generation |

`nuxt-maplibre-gl` declares `nuxt >=3.0.0` as a peer and keeps `maplibre-gl` in
its own dependencies, so a Nuxt app is unaffected by the peer change.

There is no `engines` field. Node is only constrained in practice by the build
toolchain (Vite 5, Vitest 4).

## Releasing

Both packages publish from this repository and the order matters, because the
Nuxt module depends on the root package by version range. The check that
enforces that order lives in [`nuxt/README.md`](../nuxt/README.md).

1. Set `version` in `package.json` deliberately — no script picks it for you.
2. `bun run changelog` writes the new section into `docs/changelog.md` from the
   conventional commits since the last tag. Review it.
3. Commit the version bump and the changelog together.
4. `bun run publish:vue`, then `bun run publish:nuxt`. Both refuse to start
   if that version is already on npm, which cannot be republished.
5. Push. CI tags the version and creates the GitHub release.

CI never writes to the repository. `master` requires pull requests, so a push
from `github-actions[bot]` is rejected with GH006 — when the changelog step
still ran there it failed the whole release job before it could tag anything.

## Contributing

Issues and pull requests: <https://github.com/danh121097/vue-maplibre-gl>.

The most useful contribution right now is a test for anything in the Untested
modules table — the coverage ratchet means new tests raise the floor
permanently.
