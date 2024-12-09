export function useLogger(debug: boolean = false) {
  const log = (...args: unknown[]) => {
    if (debug) console.log(...args);
  };
  return { log };
}
