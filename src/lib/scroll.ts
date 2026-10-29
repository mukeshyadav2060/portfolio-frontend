/**
 * One passive scroll/resize listener and one rAF per frame for every scroll-linked
 * effect on the page, instead of a listener per component.
 *
 * The scroll position is read inside the scroll event and cached. Reading `scrollY`
 * later in a frame (in rAF, after CSS animations have dirtied styles) forces a
 * synchronous style recalculation, which was the main source of scroll jank.
 */
type Listener = (y: number, vh: number) => void;

const listeners = new Set<Listener>();
let queued = false;
const state = { y: 0, vh: 0, tracking: false };

function track() {
  if (state.tracking || typeof window === "undefined") return;
  state.tracking = true;
  state.y = window.scrollY;
  state.vh = window.innerHeight;
  window.addEventListener("scroll", () => (state.y = window.scrollY), { passive: true });
  window.addEventListener(
    "resize",
    () => {
      state.vh = window.innerHeight;
      state.y = window.scrollY;
    },
    { passive: true },
  );
}

/** The cached scroll position and viewport height; safe to call every animation frame. */
export function readScroll() {
  track();
  return state;
}

function flush() {
  queued = false;
  for (const fn of listeners) fn(state.y, state.vh);
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(flush);
}

export function onScroll(fn: Listener) {
  track();
  if (listeners.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  listeners.add(fn);
  fn(state.y, state.vh);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

/**
 * The element's document-relative box, re-measured only when the page's layout changes,
 * so scroll handlers can compute its position from the cached scroll value without a
 * layout read per frame.
 */
export function trackBox(el: Element) {
  const box = { top: 0, height: 0 };
  const measure = () => {
    const r = el.getBoundingClientRect();
    box.top = r.top + window.scrollY;
    box.height = r.height;
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  ro.observe(el);
  return { box, stop: () => ro.disconnect() };
}

/** 0 when the element's top reaches the viewport bottom, 1 when its bottom leaves the top. */
export function progressThrough(el: Element, vh: number) {
  const r = el.getBoundingClientRect();
  return clamp01((vh - r.top) / (r.height + vh));
}

/** 0 at the element's top touching the viewport top, 1 at its bottom touching the viewport bottom. */
export function pinnedProgress(el: Element, vh: number) {
  const r = el.getBoundingClientRect();
  const span = r.height - vh;
  return span <= 0 ? 0 : clamp01(-r.top / span);
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The one way the site scrolls to a section, so smooth scrolling and the browser never
 * both handle the same jump (which made the page snap at the end). Room for the fixed
 * header comes from `scroll-padding-top` in globals.css, which Lenis and the browser
 * both apply, so no extra offset here. Returns false when the section isn't on this page.
 */
export function scrollToHash(hash: string, immediate = false) {
  const el = document.getElementById(decodeURIComponent(hash.replace(/^#/, "")));
  if (!el) return false;
  const instant = immediate || prefersReducedMotion();
  if (window.__lenis) window.__lenis.scrollTo(el, { immediate: instant, duration: 1.1 });
  else el.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
  return true;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
