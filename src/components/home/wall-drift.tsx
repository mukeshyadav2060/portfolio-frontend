"use client";

import { useEffect, useRef } from "react";
import { clamp01, onScroll, prefersReducedMotion, trackBox } from "@/lib/scroll";

/** Slides the tilted wall sideways as its section scrolls through the viewport. */
export function WallDrift({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (prefersReducedMotion() || !el?.parentElement) return;
    const { box, stop } = trackBox(el.parentElement);
    const off = onScroll((y, vh) => {
      // Same as progressThrough(), from the cached box instead of a layout read.
      const p = clamp01((vh - (box.top - y)) / (box.height + vh));
      el.style.transform = `translate3d(${((0.5 - p) * 12).toFixed(2)}%, 0, 0)`;
    });
    return () => {
      off();
      stop();
    };
  }, []);
  return (
    <div ref={ref} className="wall-drift">
      {children}
    </div>
  );
}
