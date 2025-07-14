import { computed, ref, type ComputedRef } from 'vue';

/**
 * Options for optimized computed properties
 */
interface OptimizedComputedOptions<T> {
  /** Enable deep equality checking (default: false) */
  deepEqual?: boolean;
  /** Custom equality function */
  equalityFn?: (a: T, b: T) => boolean;
  /** Cache duration in milliseconds (default: no expiration) */
  cacheDuration?: number;
}

/**
 * Creates an optimized computed property with caching and equality checking
 * Prevents unnecessary re-computations when values haven't actually changed
 *
 * @param getter - The computed getter function
 * @param options - Optimization options
 * @returns Optimized computed ref
 */
export function useOptimizedComputed<T>(
  getter: () => T,
  options: OptimizedComputedOptions<T> = {},
): ComputedRef<T> {
  const { deepEqual = false, equalityFn, cacheDuration } = options;

  const lastValue = ref<T>();
  const lastComputedTime = ref<number>(0);
  const hasInitialValue = ref(false);

  /**
   * Default equality function
   */
  function defaultEqualityFn(a: T, b: T): boolean {
    if (deepEqual) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return Object.is(a, b);
  }

  const isEqual = equalityFn || defaultEqualityFn;

  return computed(() => {
    const now = Date.now();

    // Check cache expiration
    if (cacheDuration && hasInitialValue.value) {
      const timeSinceLastCompute = now - lastComputedTime.value;
      if (timeSinceLastCompute < cacheDuration) {
        return lastValue.value as T;
      }
    }

    const newValue = getter();

    // Check if value actually changed
    if (hasInitialValue.value && isEqual(newValue, lastValue.value as T)) {
      return lastValue.value as T;
    }

    // Update cache
    lastValue.value = newValue;
    lastComputedTime.value = now;
    hasInitialValue.value = true;

    return newValue;
  });
}

/**
 * Creates a memoized function with caching
 * Useful for expensive operations that depend on reactive data
 *
 * @param fn - Function to memoize
 * @param keyFn - Function to generate cache key
 * @param maxCacheSize - Maximum cache size (default: 100)
 * @returns Memoized function
 */
export function useMemoized<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyFn: (...args: TArgs) => string = (...args) => JSON.stringify(args),
  maxCacheSize = 100,
): (...args: TArgs) => TReturn {
  const cache = new Map<string, { value: TReturn; timestamp: number }>();

  return (...args: TArgs): TReturn => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached) {
      return cached.value;
    }

    const result = fn(...args);

    // Manage cache size
    if (cache.size >= maxCacheSize) {
      // Remove oldest entry
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
}

/**
 * Creates a computed property that only updates when dependencies change significantly
 * Useful for expensive computations that should be throttled
 *
 * @param getter - The computed getter function
 * @param threshold - Minimum change threshold (for numbers)
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Throttled computed ref
 */
export function useThrottledComputed<T extends number>(
  getter: () => T,
  threshold = 0.01,
  debounceMs = 100,
): ComputedRef<T> {
  const lastValue = ref<T>();
  const timeoutId = ref<number>();

  return computed(() => {
    const newValue = getter();

    if (lastValue.value !== undefined) {
      const change = Math.abs(newValue - lastValue.value);
      if (change < threshold) {
        return lastValue.value;
      }
    }

    // Clear existing timeout
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
    }

    // Debounce the update
    timeoutId.value = window.setTimeout(() => {
      lastValue.value = newValue;
    }, debounceMs);

    return newValue;
  });
}

/**
 * Creates a computed property with automatic cleanup
 * Useful for computed properties that create resources
 *
 * @param getter - The computed getter function
 * @param cleanup - Cleanup function for old values
 * @returns Computed ref with cleanup
 */
export function useComputedWithCleanup<T>(
  getter: () => T,
  cleanup: (oldValue: T) => void,
): ComputedRef<T> {
  const lastValue = ref<T>();

  return computed(() => {
    const newValue = getter();

    // Cleanup old value if it exists and is different
    if (lastValue.value !== undefined && lastValue.value !== newValue) {
      try {
        cleanup(lastValue.value);
      } catch (error) {
        console.warn('Error during computed cleanup:', error);
      }
    }

    lastValue.value = newValue;
    return newValue;
  });
}

/**
 * Creates a computed property that batches updates
 * Useful for computed properties that trigger multiple reactive updates
 *
 * @param getter - The computed getter function
 * @param batchSize - Number of updates to batch (default: 5)
 * @param batchDelay - Delay between batches in milliseconds (default: 16)
 * @returns Batched computed ref
 */
export function useBatchedComputed<T>(
  getter: () => T,
  batchSize = 5,
  batchDelay = 16,
): ComputedRef<T> {
  const pendingUpdates = ref<T[]>([]);
  const lastValue = ref<T>();
  const timeoutId = ref<number>();

  function processBatch(): void {
    if (pendingUpdates.value.length > 0) {
      // Use the latest value from the batch
      const latestValue = pendingUpdates.value[pendingUpdates.value.length - 1];
      lastValue.value = latestValue as any;
      pendingUpdates.value = [];
    }
  }

  return computed(() => {
    const newValue = getter();

    pendingUpdates.value.push(newValue as any);

    // Process batch when it reaches the size limit
    if (pendingUpdates.value.length >= batchSize) {
      processBatch();
      return lastValue.value as T;
    }

    // Schedule batch processing
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
    }

    timeoutId.value = window.setTimeout(processBatch, batchDelay);

    return lastValue.value !== undefined ? lastValue.value : newValue;
  });
}
