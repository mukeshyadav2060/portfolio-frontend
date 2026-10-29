"use client";

import { useRef } from "react";

/** Pointer-driven 3D tilt with a soft spotlight. Mouse only; transforms only. */
export function Tilt({ children, className = "", max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    ref.current.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    ref.current.style.setProperty("--sx", `${px * 100}%`);
    ref.current.style.setProperty("--sy", `${py * 100}%`);
    ref.current.dataset.active = "";
  };
  const leave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
    delete ref.current.dataset.active;
  };

  return (
    <div style={{ perspective: "1200px" }} className={className}>
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className="group/tilt relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform:rotateX(var(--rx,0))_rotateY(var(--ry,0))] data-[active]:duration-150"
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px] opacity-0 transition-opacity duration-500 group-data-[active]/tilt:opacity-100"
          style={{ background: "radial-gradient(500px circle at var(--sx) var(--sy), rgb(255 255 255 / 0.14), transparent 45%)" }}
        />
      </div>
    </div>
  );
}
