export function useLogger(debug: boolean = false) {
  const log = (...args: unknown[]) => {
    if (debug) console.log(...args);
  };

  const logWarn = (...args: unknown[]) => {
    if (debug) console.warn(...args);
  };

  const logError = (...args: unknown[]) => {
    if (debug) console.error(...args);
  };

  return { log, logWarn, logError };
}
