import { ref, watch, onUnmounted, type Ref, type WatchSource } from 'vue';
import { useLogger } from './useLogger';

/**
 * Debounce options interface
 */
interface DebounceOptions {
  /** Delay in milliseconds (default: 300) */
  delay?: number;
  /** Whether to trigger on the leading edge (default: false) */
  leading?: boolean;
  /** Whether to trigger on the trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum delay before forcing execution (default: none) */
  maxWait?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Debounced function interface
 */
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

/**
 * Creates a debounced version of a function
 *
 * @param func - Function to debounce
 * @param options - Debounce configuration options
 * @returns Debounced function with control methods
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const {
    delay = 300,
    leading = false,
    trailing = true,
    maxWait,
    debug = false,
  } = options;

  const { log, logError } = useLogger(debug);

  let timeoutId: number | undefined;
  let maxTimeoutId: number | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let result: ReturnType<T>;

  /**
   * Invokes the original function
   */
  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    lastArgs = undefined;
    lastInvokeTime = time;

    try {
      result = func(...args);
      if (debug) {
        log('Debounced function executed', { time, delay });
      }
      return result;
    } catch (error) {
      logError('Error in debounced function:', error);
      throw error;
    }
  }

  /**
   * Determines if function should be invoked
   */
  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  /**
   * Timer callback for trailing edge
   */
  function timerExpired(): ReturnType<T> | undefined {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer
    timeoutId = window.setTimeout(
      timerExpired,
      delay - (time - (lastCallTime || 0)),
    );
  }

  /**
   * Handles trailing edge invocation
   */
  function trailingEdge(time: number): ReturnType<T> | undefined {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    return result;
  }

  /**
   * Handles leading edge invocation
   */
  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeoutId = window.setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }

  /**
   * Cancels pending invocations
   */
  function cancel(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastCallTime = undefined;
    lastArgs = undefined;
    timeoutId = undefined;
    maxTimeoutId = undefined;
  }

  /**
   * Immediately invokes the function
   */
  function flush(): ReturnType<T> | undefined {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  /**
   * Checks if there's a pending invocation
   */
  function pending(): boolean {
    return timeoutId !== undefined;
  }

  /**
   * Main debounced function
   */
  function debounced(...args: Parameters<T>): void {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        leadingEdge(lastCallTime);
      } else if (maxWait !== undefined) {
        // Handle maxWait
        timeoutId = window.setTimeout(timerExpired, delay);
        maxTimeoutId = window.setTimeout(() => {
          if (lastArgs) {
            invokeFunc(Date.now());
          }
        }, maxWait);
        if (leading) {
          invokeFunc(lastCallTime);
        }
      }
    } else if (timeoutId === undefined) {
      timeoutId = window.setTimeout(timerExpired, delay);
    }
  }

  // Cleanup on unmount
  onUnmounted(cancel);

  // Attach control methods
  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as DebouncedFunction<T>;
}

/**
 * Creates a debounced ref watcher
 *
 * @param source - Watch source
 * @param callback - Callback function
 * @param options - Debounce and watch options
 * @returns Stop function
 */
export function useDebouncedWatch<T>(
  source: WatchSource<T>,
  callback: (value: T, oldValue: T | undefined) => void,
  options: DebounceOptions & {
    immediate?: boolean;
    deep?: boolean;
    flush?: 'pre' | 'post' | 'sync';
  } = {},
): () => void {
  const { immediate, deep, flush, ...debounceOptions } = options;

  const debouncedCallback = useDebounce(callback, debounceOptions);

  const stopWatcher = watch(
    source,
    (newValue, oldValue) => {
      debouncedCallback(newValue, oldValue);
    },
    {
      immediate,
      deep,
      flush,
    },
  );

  // Return combined stop function
  return () => {
    stopWatcher();
    debouncedCallback.cancel();
  };
}

/**
 * Creates a debounced ref that updates after a delay
 *
 * @param initialValue - Initial value
 * @param delay - Debounce delay in milliseconds
 * @returns Tuple of [debouncedRef, immediateRef, flush, cancel]
 */
export function useDebouncedRef<T>(
  initialValue: T,
  delay = 300,
): [Ref<T>, Ref<T>, () => void, () => void] {
  const immediateRef = ref(initialValue) as Ref<T>;
  const debouncedRef = ref(initialValue) as Ref<T>;

  const updateDebounced = useDebounce(
    (value: T) => {
      debouncedRef.value = value;
    },
    { delay },
  );

  watch(
    immediateRef,
    (newValue) => {
      updateDebounced(newValue);
    },
    { immediate: false },
  );

  return [
    debouncedRef,
    immediateRef,
    updateDebounced.flush,
    updateDebounced.cancel,
  ];
}
