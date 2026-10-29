"use client";

import { useRef } from "react";

/** Pulls its child toward the pointer while hovered, then springs back. */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`inline-flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
    >
      {children}
    </span>
  );
}
