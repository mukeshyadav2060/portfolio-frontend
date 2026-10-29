"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

export function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2 || prefersReducedMotion()) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(id);
  }, [words.length]);

  // Every word sits invisibly in the same grid cell, so the slot is always as wide as the
  // longest one: the line wraps the same way for every word and the page never shifts.
  return (
    <span className="relative inline-grid text-accent" style={{ perspective: "400px" }}>
      {words.map((w) => (
        <span key={w} aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {w}
        </span>
      ))}
      <span key={i} className="word-in col-start-1 row-start-1 whitespace-nowrap" aria-live="off">
        {words[i]}
      </span>
      <span className="sr-only">{words.join(", ")}</span>
    </span>
  );
}
