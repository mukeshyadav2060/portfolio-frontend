"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";

/**
 * A small dot plus a thin trailing ring for fine pointers. The ring grows slightly over
 * links and buttons; elements with `data-cursor="Label"` swap the ring for a compact tag
 * beside the pointer (used on project posters). Off on touch; with reduced motion the ring
 * follows the pointer exactly instead of trailing it.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const enabled = useMediaQuery("(pointer: fine)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (!enabled) return;
    const follow = reduced ? 1 : 0.2;
    let x = innerWidth / 2,
      y = innerHeight / 2,
      rx = x,
      ry = y,
      raf = 0;

    const loop = () => {
      rx += (x - rx) * follow;
      ry += (y - ry) * follow;
      const t = `translate3d(${rx}px, ${ry}px, 0)`;
      if (ring.current) ring.current.style.transform = t;
      if (tag.current) tag.current.style.transform = t;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // Not `data-cursor`: that attribute is the per-element label the lookup below searches for.
      document.documentElement.dataset.pointer = "on";
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>("[data-cursor], a, button, [role=button], input, textarea, select, label");
      const text = target?.dataset.cursor ?? "";
      setLabel(text);
      ring.current?.setAttribute("data-state", text ? "label" : target ? "hover" : "");
      tag.current?.setAttribute("data-state", text ? "on" : "");
    };
    const leave = () => {
      document.documentElement.dataset.pointer = "off";
    };

    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;
  return (
    <div aria-hidden className="cursor-layer pointer-events-none fixed inset-0 z-100">
      {/* Ring: centred on the pointer via negative margins so transform stays free for movement. */}
      <div ref={ring} className="absolute left-0 top-0">
        <div className="cursor-ring -ml-3.5 -mt-3.5 size-7 rounded-full border border-ink/35" />
      </div>
      <div ref={tag} className="absolute left-0 top-0">
        <div className="cursor-tag ml-4 mt-4 whitespace-nowrap rounded-md bg-bg px-2.5 py-1.5 text-[13px] font-medium text-ink shadow-[0_6px_20px_-6px_rgb(0_0_0/0.6)]">
          {label} ↗
        </div>
      </div>
      <div ref={dot} className="absolute left-0 top-0">
        <div className="-ml-0.75 -mt-0.75 size-1.5 rounded-full bg-accent" />
      </div>
    </div>
  );
}
