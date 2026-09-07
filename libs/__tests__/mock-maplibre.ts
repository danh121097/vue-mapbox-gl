import { vi } from 'vitest';

/**
 * Minimal stand-in for `maplibre-gl`'s `Map`.
 *
 * MapLibre needs a real WebGL context, which happy-dom does not provide, so
 * tests that exercise map lifecycle swap the class out for this one. It covers
 * the event bus plus the setters and queries the library actually calls.
 */
export class MockMap {
  options: Record<string, any>;
  /** Truthy so the library's `hasSource` / `hasLayer` guards pass. */
  style: Record<string, unknown> = {};
  private listeners = new Map<string, Set<(...args: any[]) => void>>();
  /**
   * Layer-scoped handlers, keyed `event::layerId`. MapLibre's three-argument
   * `on(type, layerId, handler)` is a different subscription from the global
   * two-argument form, and the library uses it for every layer event — a mock
   * that collapsed the two would make an unattached listener look attached.
   */
  private layerListeners = new Map<string, Set<(...args: any[]) => void>>();
  /**
   * Per event, the wrapper `once` actually attached, keyed by the handler the
   * caller passed. MapLibre's `Evented` keeps one-time listeners in their own
   * list and `off` searches it by identity, so `off(type, handler)` cancels a
   * pending `once(type, handler)`. Without this map a wrapper would be
   * unreachable by the caller's reference and every `once` + cleanup pair in
   * the library would look like a leak.
   */
  private onceWrappers = new Map<
    string,
    Map<(...args: any[]) => void, (...args: any[]) => void>
  >();
  private images = new Map<string, unknown>();
  private sources = new Map<string, unknown>();
  private layers = new Map<string, unknown>();
  private isLoaded = false;
  /**
   * Tracked separately from `isLoaded`: MapLibre's `loaded()` also waits on
   * in-flight tiles, while `isStyleLoaded()` only reports the style. Code that
   * gates on one is not interchangeable with code that gates on the other, so
   * a test can drive them apart with `setStyleLoaded`.
   */
  private styleLoaded = false;

  setCenter = vi.fn();
  setZoom = vi.fn();
  setBearing = vi.fn();
  setPitch = vi.fn();
  setStyle = vi.fn();
  setMaxBounds = vi.fn();
  setMaxPitch = vi.fn();
  setMaxZoom = vi.fn();
  setMinPitch = vi.fn();
  setMinZoom = vi.fn();
  setRenderWorldCopies = vi.fn();
  fitScreenCoordinates = vi.fn();
  remove = vi.fn();

  constructor(options: Record<string, any> = {}) {
    this.options = options;
  }

  /**
   * Splits MapLibre's overloaded signature: `(type, handler)` subscribes to the
   * map, `(type, layerId, handler)` subscribes to one layer.
   */
  private resolveTarget(
    event: string,
    layerIdOrHandler: string | ((...args: any[]) => void),
    maybeHandler?: (...args: any[]) => void,
  ): {
    store: Map<string, Set<(...args: any[]) => void>>;
    key: string;
    handler: (...args: any[]) => void;
  } {
    if (typeof layerIdOrHandler === 'string') {
      return {
        store: this.layerListeners,
        key: `${event}::${layerIdOrHandler}`,
        handler: maybeHandler!,
      };
    }
    return { store: this.listeners, key: event, handler: layerIdOrHandler };
  }

  on(
    event: string,
    layerIdOrHandler: string | ((...args: any[]) => void),
    maybeHandler?: (...args: any[]) => void,
  ): this {
    const { store, key, handler } = this.resolveTarget(
      event,
      layerIdOrHandler,
      maybeHandler,
    );
    if (!store.has(key)) store.set(key, new Set());
    store.get(key)!.add(handler);
    return this;
  }

  off(
    event: string,
    layerIdOrHandler: string | ((...args: any[]) => void),
    maybeHandler?: (...args: any[]) => void,
  ): this {
    const { store, key, handler } = this.resolveTarget(
      event,
      layerIdOrHandler,
      maybeHandler,
    );
    store.get(key)?.delete(handler);

    const wrapped = this.onceWrappers.get(key)?.get(handler);
    if (wrapped) {
      store.get(key)?.delete(wrapped);
      this.onceWrappers.get(key)!.delete(handler);
    }
    return this;
  }

  once(event: string, handler: (...args: any[]) => void): this {
    const wrapped = (...args: any[]) => {
      this.off(event, handler);
      handler(...args);
    };
    if (!this.onceWrappers.has(event)) this.onceWrappers.set(event, new Map());
    this.onceWrappers.get(event)!.set(handler, wrapped);
    return this.on(event, wrapped);
  }

  /** Test helper — dispatches an event to every map-level handler. */
  fire(event: string, ...args: any[]): void {
    if (event === 'load') {
      this.isLoaded = true;
      this.styleLoaded = true;
    }
    [...(this.listeners.get(event) ?? [])].forEach((handler) =>
      handler(...args),
    );
  }

  /** Test helper — dispatches an event to the handlers bound to one layer. */
  fireOnLayer(event: string, layerId: string, ...args: any[]): void {
    [...(this.layerListeners.get(`${event}::${layerId}`) ?? [])].forEach(
      (handler) => handler(...args),
    );
  }

  /** Test helper — how many map-level handlers are attached for an event. */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /** Test helper — how many handlers are bound to one layer's event. */
  layerListenerCount(event: string, layerId: string): number {
    return this.layerListeners.get(`${event}::${layerId}`)?.size ?? 0;
  }

  /**
   * Test helper — drives `isStyleLoaded()` without also claiming every tile has
   * arrived, so a gate on the wrong one of the two is visible.
   */
  setStyleLoaded(value: boolean): void {
    this.styleLoaded = value;
  }

  loaded(): boolean {
    return this.isLoaded;
  }

  isStyleLoaded(): boolean {
    return this.styleLoaded;
  }

  getCenter() {
    return { lng: 0, lat: 0 };
  }
  getZoom() {
    return 1;
  }
  getBearing() {
    return 0;
  }
  getPitch() {
    return 0;
  }

  // --- image API ---
  hasImage(id: string): boolean {
    return this.images.has(id);
  }

  addImage(id: string, image: unknown): void {
    this.images.set(id, image);
  }

  updateImage(id: string, image: unknown): void {
    this.images.set(id, image);
  }

  removeImage(id: string): void {
    this.images.delete(id);
  }

  /** Test helper — URLs added here make `loadImage` reject. */
  failingUrls = new Set<string>();

  async loadImage(url: string): Promise<{ data: unknown }> {
    if (this.failingUrls.has(url)) {
      throw new Error(`404 ${url}`);
    }
    return { data: { width: 1, height: 1, url } };
  }

  /** Test helper — ids currently registered on the map. */
  imageIds(): string[] {
    return [...this.images.keys()];
  }

  // --- source API ---
  addSource(id: string, spec: unknown): void {
    this.sources.set(id, { id, ...(spec as object), setData: vi.fn() });
  }

  getSource(id: string): unknown {
    return this.sources.get(id);
  }

  removeSource(id: string): void {
    this.sources.delete(id);
  }

  /** Test helper — source ids currently on the map. */
  sourceIds(): string[] {
    return [...this.sources.keys()];
  }

  // --- layer API ---
  addLayer(spec: { id: string }): void {
    this.layers.set(spec.id, spec);
  }

  getLayer(id: string): unknown {
    return this.layers.get(id);
  }

  removeLayer(id: string): void {
    this.layers.delete(id);
  }

  /** Test helper — layer ids currently on the map. */
  layerIds(): string[] {
    return [...this.layers.keys()];
  }
}

/**
 * `vi.mock` factory that keeps every real maplibre-gl export except `Map`.
 * The library reads `getVersion()` from the real module, so a blanket mock
 * would break unrelated helpers.
 */
export async function mockMaplibreModule(
  importOriginal: () => Promise<Record<string, any>>,
): Promise<Record<string, any>> {
  const actual = await importOriginal();
  return { ...actual, Map: MockMap };
}
