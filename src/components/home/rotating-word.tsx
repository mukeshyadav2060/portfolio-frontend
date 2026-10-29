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

  return (
    <span className="relative inline-block text-accent" style={{ perspective: "400px" }}>
      <span key={i} className="word-in" aria-live="off">
        {words[i]}
      </span>
      <span className="sr-only">{words.join(", ")}</span>
    </span>
  );
}
