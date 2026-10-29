"use client";

import { useState } from "react";
import type { Service } from "@/lib/types";

const SHAPES = ["circle(50%)", "polygon(50% 0,100% 100%,0 100%)", "inset(0 round 18%)", "polygon(50% 0,100% 50%,50% 100%,0 50%)"];

function Details({ s }: { s: Service }) {
  return (
    <>
      <p className="text-xl leading-relaxed text-ink">{s.summary}</p>
      <ul className="mt-7 space-y-3">
        {s.points.map((p) => (
          <li key={p} className="flex gap-3 text-ink-2">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Desktop: big titles on the left; hovering, focusing or tapping one swaps the sticky
 * detail panel on the right. Phones: every row shows its own details inline.
 */
export function ServiceIndex({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);
  const current = services[active] ?? services[0];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <ol className="lg:col-span-7">
        {services.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.id} suppressHydrationWarning data-reveal style={{ "--d": i * 90 } as React.CSSProperties}>
              <button
                type="button"
                aria-expanded={on}
                aria-controls="service-panel"
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group flex w-full items-center gap-5 py-5 text-left md:py-7"
              >
                <span
                  aria-hidden
                  className={`size-[0.55em] shrink-0 bg-accent text-[clamp(2.2rem,5.2vw,4.75rem)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0 max-lg:scale-75 max-lg:opacity-100 max-lg:rotate-0"}`}
                  style={{ clipPath: SHAPES[i % SHAPES.length] }}
                />
                <span
                  className={`font-display text-[clamp(2.2rem,5.2vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.045em] transition-[color,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "translate-x-0 text-ink" : "-translate-x-[0.6em] text-ink-3 group-hover:text-ink-2 max-lg:translate-x-0 max-lg:text-ink"}`}
                >
                  {s.title}
                </span>
              </button>
              <div className="pb-8 pl-[calc(0.55*clamp(2.2rem,5.2vw,4.75rem)+1.25rem)] lg:hidden">
                <Details s={s} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hidden lg:col-span-5 lg:block">
        <div id="service-panel" aria-live="polite" className="sticky top-32 overflow-hidden rounded-[10px] bg-bg-3 p-10">
          <div key={active} className="service-swap">
            <p className="text-sm text-ink-3">
              {active + 1} of {services.length}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em]">{current.title}</h3>
            <div className="mt-6">
              <Details s={current} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
