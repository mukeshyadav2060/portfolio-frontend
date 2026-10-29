"use client";

import { useSyncExternalStore } from "react";

/** Live media query match; `server` is the value used for SSR and hydration. */
export function useMediaQuery(query: string, server = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => server,
  );
}

/** Current time in `stepMs` steps (null during SSR, so server and client markup match). */
export function useNow(stepMs: number) {
  const step = useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, stepMs / 4);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / stepMs),
    () => null,
  );
  return step === null ? null : new Date(step * stepMs);
}

const noSubscribe = () => () => {};

/** A browser-only value that never changes after load, e.g. the platform. */
export function useClientValue<T>(read: () => T, server: T) {
  return useSyncExternalStore(noSubscribe, read, () => server);
}
