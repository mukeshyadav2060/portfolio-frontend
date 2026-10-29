"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { href: string; label: string; id: string };

const GLYPHS = "abcdefghijklmnopqrstuvwxyz<>/{}=+*";

/** Scrambles the label briefly on hover, then settles. */
function Scramble({ text }: { text: string }) {
  const [out, setOut] = useState(text);
  const run = () => {
    let frame = 0;
    const total = text.length * 2 + 4;
    const tick = () => {
      frame++;
      setOut(
        text
          .split("")
          .map((ch, i) => (i < frame / 2 ? ch : ch === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (frame < total) requestAnimationFrame(tick);
      else setOut(text);
    };
    requestAnimationFrame(tick);
  };
  return (
    <span onPointerEnter={run} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const [section, setSection] = useState<string | null>(null);
  const isHome = pathname === "/";
  // Inner pages map to a nav item by route; the home page tracks the section in view.
  const active = isHome ? section : pathname.startsWith("/blog") ? "writing" : pathname.startsWith("/work") ? "work" : null;

  useEffect(() => {
    if (!isHome) return;
    // The hero (#top) is watched too, so returning to it clears the highlight.
    const sections = [...items.map((i) => i.id), "top"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSection(e.target.id === "top" ? null : e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [isHome, items]);

  return (
    <nav aria-label="Primary" className="max-md:hidden">
      <ul className="flex items-center gap-1 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={active === item.id ? "true" : undefined}
              className="relative block px-3.5 py-2 text-ink-2 transition-colors hover:text-ink aria-[current]:text-ink"
            >
              <Scramble text={item.label} />
              <span
                aria-hidden
                className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${active === item.id ? "scale-x-100" : "scale-x-0"}`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
