"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string; id: string };

/** Phones only: a hamburger that opens the primary nav as a full-screen sheet under the header. */
export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Sheet comes first in the DOM so the toggle and "Let’s talk" paint above it; the logo sits on z-10.
          touch-none keeps a swipe on the sheet from scrolling the page underneath. */}
      <nav
        id="mobile-nav"
        aria-label="Primary"
        inert={!open}
        className={`fixed inset-0 touch-none bg-bg pt-[72px] transition-[opacity,visibility] duration-400 md:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <ul className="frame mt-6">
          {items.map((item, i) => (
            <li key={item.id} className="border-b border-line">
              <Link
                ref={i === 0 ? first : undefined}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-baseline gap-4 py-5 font-display text-[2.25rem] font-bold leading-none tracking-[-0.04em] transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              >
                <span className="font-sans text-sm font-medium tracking-normal text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-md bg-bg-3 text-ink md:hidden"
      >
        <span aria-hidden className={`absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "rotate-45" : "-translate-y-[3.5px]"}`} />
        <span aria-hidden className={`absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "-rotate-45" : "translate-y-[3.5px]"}`} />
      </button>
    </>
  );
}
