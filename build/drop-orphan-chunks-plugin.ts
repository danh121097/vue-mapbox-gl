import type { Plugin } from 'vite';

/**
 * Removes non-entry chunks that no other chunk imports.
 *
 * With `preserveModules`, the Vue SFC plugin's `?vue&type=…` sub-requests each
 * survive as their own module. Rollup rewrites every importer to point at the
 * module that actually defines a binding, so the SFC facade — a one-line
 * re-export of its own script module — ends up with no importers at all, yet
 * `preserveModules` still writes it to disk as `Foo.vue2.js`. A chunk that is
 * neither an entry nor reachable from one is unreachable by definition, so
 * dropping it cannot change the emitted module graph.
 */
export function dropOrphanChunks(): Plugin {
  return {
    name: 'drop-orphan-chunks',
    generateBundle(_options, bundle) {
      const imported = new Set<string>();
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        for (const id of [...output.imports, ...output.dynamicImports]) {
          imported.add(id);
        }
      }
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk' || output.isEntry) continue;
        if (!imported.has(fileName)) delete bundle[fileName];
      }
    },
  };
}
