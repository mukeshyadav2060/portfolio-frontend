"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { clamp01, prefersReducedMotion, readScroll } from "@/lib/scroll";
import type { FieldState } from "./engine";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Fixed full-screen layer behind the page. The engine is imported only after the page is
 * idle (on phones: after the first interaction), so it never competes with first paint,
 * LCP or input. On inner pages it stays a starfield.
 */
export function ParticleField({ accent, initials }: { accent: string; initials: string }) {
  const host = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const homeRef = useRef(isHome);
  useEffect(() => {
    homeRef.current = isHome;
  }, [isHome]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;

    let stop: (() => void) | undefined;
    let cancelled = false;
    let started = false;

    // Document position of #contact, measured on resize only: no layout reads per frame.
    let contactTop = Infinity;
    const measure = () => {
      const c = document.getElementById("contact");
      contactTop = c ? c.getBoundingClientRect().top + scrollY : Infinity;
    };
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    // Called every animation frame: use the cached scroll position (see lib/scroll).
    const read = (): FieldState => {
      const { y, vh } = readScroll();
      if (!homeRef.current) return { scatter: 1, ring: 0, scrollY: y };
      const scatter = ease(clamp01(y / (vh * 0.85)));
      const ring = ease(clamp01((vh * 0.95 - (contactTop - y)) / (vh * 0.7)));
      return { scatter, ring, scrollY: y };
    };

    const start = () => {
      if (started || cancelled) return;
      started = true;
      measure();
      // The initials are drawn in the site's display face, so wait until it has loaded.
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-display-face").trim() || "sans-serif";
      Promise.all([import("./engine"), document.fonts.load(`800 100px ${font}`).catch(() => [])]).then(([{ startField }]) => {
        if (cancelled) return;
        try {
          stop = startField(el, { accent, text: initials, font, reduced: prefersReducedMotion(), read });
          el.dataset.ready = "";
        } catch (error) {
          console.warn("Particle field disabled:", error);
        }
      });
    };

    const coarse = matchMedia("(pointer: coarse), (max-width: 767px)").matches;
    const triggers = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle: number | undefined;
    if (coarse) {
      // Phones: the hero reads fine without it, so spend battery only once the visitor engages.
      triggers.forEach((t) => addEventListener(t, start, { once: true, passive: true }));
    } else if ("requestIdleCallback" in window) {
      idle = requestIdleCallback(start, { timeout: 1500 });
    } else {
      timer = setTimeout(start, 400);
    }

    return () => {
      cancelled = true;
      ro.disconnect();
      triggers.forEach((t) => removeEventListener(t, start));
      if (idle !== undefined) cancelIdleCallback(idle);
      clearTimeout(timer);
      stop?.();
      delete el.dataset.ready;
    };
  }, [accent, initials]);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-lvh w-full opacity-0 transition-opacity duration-[1.6s] data-[ready]:opacity-100"
    />
  );
}
