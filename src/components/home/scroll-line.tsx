"use client";

import { useEffect, useRef } from "react";
import { clamp01, onScroll, trackBox } from "@/lib/scroll";

/** The timeline's spine, drawn downward as the list scrolls past the middle of the screen. */
export function ScrollLine() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const line = ref.current;
    const list = line?.parentElement?.parentElement;
    if (!line || !list) return;
    const { box, stop } = trackBox(list);
    const off = onScroll((y, vh) => {
      line.style.transform = `scaleY(${clamp01((vh * 0.6 - (box.top - y)) / box.height).toFixed(4)})`;
    });
    return () => {
      off();
      stop();
    };
  }, []);
  return (
    <span aria-hidden className="absolute bottom-0 left-0 top-2 w-px bg-ink/10">
      <span ref={ref} className="absolute inset-0 origin-top scale-y-0 bg-accent" />
    </span>
  );
}
