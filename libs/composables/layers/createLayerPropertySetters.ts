import type { StyleSetterOptions } from 'maplibre-gl';

type SetPropertyFn = (
  name: string,
  value: any,
  options?: StyleSetterOptions,
) => void;
type LogErrorFn = (...args: any[]) => void;

/**
 * Creates a shared `setStyle` function that dispatches style keys to paint or layout.
 * Eliminates identical setStyle implementations across all 4 layer composables.
 */
export function createSetStyle<TStyle extends Record<string, any>>(
  setPaintProperty: SetPropertyFn,
  setLayoutProperty: SetPropertyFn,
  paintKeys: readonly string[],
  layoutKeys: readonly string[],
  logError: LogErrorFn,
) {
  return function setStyle(styleVal: TStyle = {} as TStyle): void {
    if (!styleVal || typeof styleVal !== 'object') return;
    try {
      for (const key of Object.keys(styleVal)) {
        const value = styleVal[key];
        if (value === undefined) continue;
        if ((paintKeys as readonly string[]).includes(key)) {
          setPaintProperty(key, value, { validate: false });
        } else if ((layoutKeys as readonly string[]).includes(key)) {
          setLayoutProperty(key, value, { validate: false });
        }
      }
    } catch (error) {
      logError('Error updating layer style:', error);
    }
  };
}

/**
 * Creates a shared `setVisibility` function.
 */
export function createSetVisibility(
  setLayoutProperty: SetPropertyFn,
  logError: LogErrorFn,
) {
  return function setVisibility(
    visibility: 'visible' | 'none',
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('visibility', visibility, options);
    } catch (error) {
      logError('Error setting layer visibility:', error);
    }
  };
}

/**
 * Creates a typed property setter with try-catch error handling.
 * The generic keeps the caller's value type, so a setter built here has the
 * same signature as a hand-written one.
 *
 * @param setFn - setPaintProperty or setLayoutProperty from useCreateLayer
 * @param propertyName - CSS property name (e.g., 'circle-color')
 * @param logError - Logger error function
 */
export function createPropertySetter<T>(
  setFn: SetPropertyFn,
  propertyName: string,
  logError: LogErrorFn,
): (value: T, options?: StyleSetterOptions) => void {
  return (value: T, options: StyleSetterOptions = { validate: true }): void => {
    try {
      setFn(propertyName, value, options);
    } catch (error) {
      logError(`Error setting ${propertyName}:`, error);
    }
  };
}
