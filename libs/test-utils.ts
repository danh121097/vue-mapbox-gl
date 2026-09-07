import { createApp, defineComponent } from 'vue';

/**
 * Mounts `composable` inside a real component setup context and hands back both
 * its return value and a way to tear the host down.
 *
 * Composables here register `onUnmounted` / `onScopeDispose` cleanup, and none
 * of that runs unless something actually unmounts — so a test that never
 * unmounts cannot observe teardown at all.
 */
function mountComposable<T>(composable: () => T): {
  result: T;
  unmount: () => void;
} {
  let result: T;
  const app = createApp(
    defineComponent({
      setup() {
        result = composable();
        return () => null;
      },
    }),
  );
  app.mount(document.createElement('div'));
  return { result: result!, unmount: () => app.unmount() };
}

/**
 * Runs composable code inside a Vue component setup context and returns what it
 * returned. Use when the test only cares about behaviour while mounted.
 */
export function withSetup<T>(composable: () => T): T {
  return mountComposable(composable).result;
}

/**
 * Same as {@link withSetup}, but also returns `unmount` so a test can assert on
 * what cleanup does.
 */
export function withSetupScope<T>(composable: () => T): {
  result: T;
  unmount: () => void;
} {
  return mountComposable(composable);
}
