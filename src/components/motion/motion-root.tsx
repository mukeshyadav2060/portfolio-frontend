"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefersReducedMotion, scrollToHash } from "@/lib/scroll";

declare global {
  interface Window {
    __motionReady?: boolean;
    __lenis?: { scrollTo: (target: string | number | HTMLElement, opts?: object) => void; destroy: () => void };
  }
}

/**
 * Global motion runtime: reveals `[data-reveal]` / `[data-split]` elements as they enter
 * the viewport and starts Lenis smooth scrolling once the page is idle.
 */
export function MotionRoot() {
  const pathname = usePathname();

  // Entrance observer, re-scanned on every route change.
  useEffect(() => {
    window.__motionReady = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-in", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    const scan = () =>
      document.querySelectorAll("[data-reveal]:not([data-in]), [data-split]:not([data-in])").forEach((el) => io.observe(el));
    scan();
    // Streamed Suspense content arrives after mount.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  // Smooth scroll, loaded lazily so it never competes with first paint.
  useEffect(() => {
    if (prefersReducedMotion() || matchMedia("(pointer: coarse)").matches) return;
    let cancelled = false;
    const start = () =>
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        // No `anchors`: in-page links are handled once, below, so Lenis and the router
        // never both scroll for the same click.
        const lenis = new Lenis({ autoRaf: true, lerp: 0.11 });
        window.__lenis = lenis;
      });
    const id = "requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600);
    return () => {
      cancelled = true;
      if ("cancelIdleCallback" in window) cancelIdleCallback(id as number);
      window.__lenis?.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // Links to a section of the current page ("/#work" on the home page): scroll there once
  // and update the hash, instead of letting the router jump while Lenis animates. Runs in
  // the capture phase so next/link sees the click as handled and skips its navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      if (!scrollToHash(url.hash)) return;
      e.preventDefault();
      if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
    };
    addEventListener("click", onClick, true);
    return () => removeEventListener("click", onClick, true);
  }, []);

  // New page: start at the top (Lenis keeps its own position otherwise).
  useEffect(() => {
    if (!location.hash) window.__lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
