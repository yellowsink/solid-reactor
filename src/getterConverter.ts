// tracks solid and react getters for signal/state and similar

import { untrack } from "solid-js";

const getterMap = new Map<any, () => any>();

export function reactifyGetter<T>(sg: () => T): T {
  const value = untrack(sg);

  getterMap.set(value, sg);
  return value;
}

export function solidifyGetter<T>(rg: T): () => T {
  // @ts-expect-error - undefined moment
  return getterMap.get(rg);
}

// epic functional programming wew
export function forgetGetter<T>(getter: T | (() => T)) {
  getterMap.delete(getter instanceof Function ? untrack(getter) : getter);
}

export const getCurrentSolidGetters = () => Array.from(getterMap.values());
export const getCurrentReactGetters = () => Array.from(getterMap.keys());