"use client";

import { useEffect, useRef, useState } from "react";
import { onScroll, prefersReducedMotion, trackBox } from "@/lib/scroll";

const R = 21;
const C = 2 * Math.PI * R;

/** Appears after the first screen; its ring fills with page progress. */
export function ScrollTop() {
  const [shown, setShown] = useState(false);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    // Page height from a cached box: no layout read per scroll frame.
    const { box, stop } = trackBox(document.body);
    const off = onScroll((y, vh) => {
      setShown(y > vh * 0.9);
      const max = box.height - vh;
      if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - (max > 0 ? Math.min(1, y / max) : 0)));
    });
    return () => {
      off();
      stop();
    };
  }, []);

  const toTop = () => {
    if (window.__lenis && !prefersReducedMotion()) window.__lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // Return focus to the top of the page for keyboard users.
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      className={`group fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-bg-3 text-ink transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent hover:text-accent-ink md:bottom-8 md:right-8 ${shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <svg aria-hidden viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
        <circle
          ref={ring}
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          className="transition-opacity group-hover:opacity-0"
        />
      </svg>
      <svg aria-hidden viewBox="0 0 24 24" className="size-5 transition-transform duration-500 group-hover:-translate-y-0.5">
        <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
