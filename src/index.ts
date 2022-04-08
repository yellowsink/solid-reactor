import {
  createEffect,
  createSignal,
  onCleanup,
  createContext,
  useContext,
  Accessor,
  on,
  createRenderEffect,
  createMemo,
} from "solid-js";
import type { EffectFunction } from "solid-js/types/reactive/signal";
import {
  reactifyGetter,
  forgetGetter,
  solidifyGetter,
  getCurrentReactGetters,
} from "./getterConverter";

type StateSetterArg<T> = Exclude<T, Function> | ((old: T | undefined) => T);

export function useState<T>(
  initialState?: Exclude<T, Function> | (() => T),
  alwaysUpdate = false
): [T | undefined, (newVal: StateSetterArg<T>) => void] {
  const resolvedInitialState =
    initialState instanceof Function ? initialState() : initialState;

  const [get, set] = createSignal(resolvedInitialState, {
    equals: alwaysUpdate ? () => true : false,
  });

  onCleanup(() => forgetGetter(get));

  return [reactifyGetter(get), set];
}

export function useEffect(
  effector: () => undefined | (() => unknown),
  deps?: any[]
) {
  if (!deps) deps = getCurrentReactGetters();

  let unmountHandler: undefined | (() => unknown);

  onCleanup(() => unmountHandler?.());

  let callback: EffectFunction<unknown, void> = () => {
    if (!unmountHandler) unmountHandler = effector();
  };

  for (const dep of deps) {
    const oldCb = callback;
    callback = on(solidifyGetter(dep), oldCb);
  }

  createEffect(callback);
}

export function useLayoutEffect(
  effector: () => undefined | (() => unknown),
  deps?: any[]
) {
  if (!deps) deps = getCurrentReactGetters();

  let unmountHandler: undefined | (() => unknown);

  onCleanup(() => unmountHandler?.());

  let callback: EffectFunction<unknown, void> = () => {
    if (!unmountHandler) unmountHandler = effector();
  };

  for (const dep of deps) {
    const oldCb = callback;
    callback = on(solidifyGetter(dep), oldCb);
  }

  createRenderEffect(callback);
}

export { createContext, useContext, createMemo as useMemo };

// Solid API
export function createReducer<T>(
  reducer: (prev?: T) => T,
  initial: T
): [Accessor<T>, () => void] {
  const [get, set] = createSignal(initial);

  return [get, () => set(() => reducer(get()))];
}

// React API
export function useReducer<T>(
  reducer: (prev?: T) => T,
  initial?: T,
  init?: () => T
): [T | undefined, () => void] {
  // initial, or if its not there, init(), else undefined.
  const resolvedInitialState = initial ?? init?.();

  const [get, set] = createReducer<T | undefined>(
    reducer,
    resolvedInitialState
  );

  onCleanup(() => forgetGetter(get));

  return [reactifyGetter(get), set];
}

export function useCallback<Tf extends Function>(cb: Tf, deps?: any[]) {
  if (!deps) deps = getCurrentReactGetters();

  let callback: EffectFunction<unknown, void> = () => cb;

  for (const dep of deps) {
    const oldCb = callback;
    callback = on(solidifyGetter(dep), oldCb);
  }

  return () => callback(undefined);
}

export function useRef(value: unknown): never {
  throw new Error(
    "useRef is not implemented as it cannot be made to work with both JSX *and* manual usage. Just use a `let`, I promise it works just how a react useRef does."
  );
}
