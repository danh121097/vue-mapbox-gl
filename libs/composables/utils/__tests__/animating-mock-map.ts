import { vi } from 'vitest';
import { MockMap } from '../../../__tests__/mock-maplibre';

/**
 * `MockMap` plus the camera methods, modelling the two MapLibre behaviours the
 * camera composables depend on:
 *
 * - Starting an ease stops the one in flight, which synchronously fires the
 *   interrupted ease's end events *inside* the new call — carrying the old
 *   call's `eventData`, not the new one's.
 * - `zoomend` / `rotateend` only fire when the zoom / bearing actually changed;
 *   `moveend` always fires.
 *
 * Nothing completes on its own — call `complete()` to end the in-flight ease.
 */
export class AnimatingMockMap extends MockMap {
  private zoom = 1;
  private bearing = 0;
  private inflight: {
    eventData: unknown;
    zoom: number;
    bearing: number;
  } | null = null;

  getZoom(): number {
    return this.zoom;
  }

  getBearing(): number {
    return this.bearing;
  }

  /** Whether an ease is in flight — mirrors MapLibre's `isMoving()`. */
  isMoving(): boolean {
    return this.inflight !== null;
  }

  /** Ends the in-flight ease the way MapLibre's `_afterEase` does. */
  complete(): void {
    const ease = this.inflight;
    if (!ease) return;
    this.inflight = null;
    const zooming = ease.zoom !== this.zoom;
    const rotating = ease.bearing !== this.bearing;
    this.zoom = ease.zoom;
    this.bearing = ease.bearing;
    this.fire('moveend', { type: 'moveend', ...(ease.eventData as object) });
    if (zooming) {
      this.fire('zoomend', { type: 'zoomend', ...(ease.eventData as object) });
    }
    if (rotating) {
      this.fire('rotateend', {
        type: 'rotateend',
        ...(ease.eventData as object),
      });
    }
  }

  private startEase(
    target: { zoom?: number; bearing?: number },
    eventData: unknown,
  ): this {
    this.complete();
    this.inflight = {
      eventData,
      zoom: target.zoom ?? this.zoom,
      bearing: target.bearing ?? this.bearing,
    };
    return this;
  }

  stop = vi.fn(() => {
    this.complete();
    return this;
  });

  easeTo = vi.fn((options: any, eventData?: unknown) =>
    this.startEase(options ?? {}, eventData),
  );

  flyTo = vi.fn((options: any, eventData?: unknown) =>
    this.startEase(options ?? {}, eventData),
  );

  zoomTo = vi.fn((zoom: number, _options?: any, eventData?: unknown) =>
    this.startEase({ zoom }, eventData),
  );

  zoomIn = vi.fn((_options?: any, eventData?: unknown) =>
    this.startEase({ zoom: this.zoom + 1 }, eventData),
  );

  zoomOut = vi.fn((_options?: any, eventData?: unknown) =>
    this.startEase({ zoom: this.zoom - 1 }, eventData),
  );

  rotateTo = vi.fn((bearing: number, _options?: any, eventData?: unknown) =>
    this.startEase({ bearing }, eventData),
  );

  resetNorth = vi.fn((_options?: any, eventData?: unknown) =>
    this.startEase({ bearing: 0 }, eventData),
  );

  panTo = vi.fn((_lnglat: unknown, _options?: any, eventData?: unknown) =>
    this.startEase({}, eventData),
  );

  panBy = vi.fn((_offset: unknown, _options?: any, eventData?: unknown) =>
    this.startEase({}, eventData),
  );

  jumpTo = vi.fn((_options: any, eventData?: unknown) => {
    this.complete();
    this.fire('moveend', { type: 'moveend', ...(eventData as object) });
    return this;
  });
}

/** Lets queued `.then` callbacks run so a settled flag reflects the promise. */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Resolves to whether `promise` has settled by the time microtasks drain. */
export async function hasSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  promise.then(
    () => (settled = true),
    () => (settled = true),
  );
  await flushPromises();
  return settled;
}
