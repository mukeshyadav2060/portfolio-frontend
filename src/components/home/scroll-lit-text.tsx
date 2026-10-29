"use client";

import { useEffect, useRef } from "react";
import { clamp01, onScroll, prefersReducedMotion, trackBox } from "@/lib/scroll";

/**
 * A statement whose words light up one by one as it scrolls through the viewport.
 * Server-rendered text; the script only writes one CSS variable. Unlit words stay at 40%
 * opacity, which keeps this large text above the 3:1 contrast minimum.
 */
export function ScrollLitText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--p", "1");
      return;
    }
    const { box, stop } = trackBox(el);
    const off = onScroll((y, vh) => {
      // Lit from when the block's top reaches 85% of the viewport until its bottom reaches 45%.
      const p = clamp01((vh * 0.85 - (box.top - y)) / (box.height + vh * 0.4));
      el.style.setProperty("--p", p.toFixed(4));
    });
    return () => {
      off();
      stop();
    };
  }, []);

  return (
    <p ref={ref} className={className} style={{ "--n": words.length, "--p": 0 } as React.CSSProperties}>
      {words.map((w, i) => (
        <span
          key={i}
          className="transition-opacity duration-200"
          style={{ opacity: `clamp(0.4, calc(var(--p) * (var(--n) + 4) - ${i}), 1)` }}
        >
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
