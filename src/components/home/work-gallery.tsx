"use client";

import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition } from "react";
import type { ProjectCard } from "@/lib/types";
import { statusLabel } from "@/lib/format";
import { ProjectVisual } from "@/components/work/project-visual";
import { Tilt } from "@/components/work/tilt";

function Meta({ p }: { p: ProjectCard }) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
        <span className={`size-2 rounded-full ${p.status === "production" ? "bg-accent" : "bg-ink-3"}`} aria-hidden />
        {[statusLabel[p.status], p.category, p.year].filter(Boolean).join(" · ")}
      </p>
      <h3 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,4.5rem)] font-bold leading-[0.92] tracking-[-0.045em]">{p.title}</h3>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-ink">{p.summary}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <li key={s} className="tag rounded-md bg-bg-3 px-2.5 py-1.5 text-ink-2">
            {s}
          </li>
        ))}
      </ul>
      <Link href={`/work/${p.slug}`} prefetch className="group mt-8 inline-flex items-center gap-3 text-lg font-medium">
        <span className="link-draw">Read the case study</span>
        <span aria-hidden className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">
          →
        </span>
      </Link>
    </>
  );
}

/**
 * Posters scroll on the right; the left column stays pinned and swaps to the project
 * whose poster is crossing the middle of the screen. Phones get poster + details inline.
 */
export function WorkGallery({ projects }: { projects: ProjectCard[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>("[data-index]");
    if (!items) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = projects[active] ?? projects[0];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-[18vh]">
          <div className="flex items-baseline gap-3 font-display text-[clamp(3.5rem,7vw,6.5rem)] font-bold leading-none tracking-[-0.06em]">
            <span className="relative inline-block h-[1em] overflow-hidden tabular-nums">
              <span className="work-counter block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateY(${-active}em)` }}>
                {projects.map((_, i) => (
                  <span key={i} className="block h-[1em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                ))}
              </span>
            </span>
            <span className="text-[0.3em] tracking-normal text-ink-3">/ {String(projects.length).padStart(2, "0")}</span>
          </div>
          <div key={current.slug} className="service-swap mt-10" aria-live="polite">
            <Meta p={current} />
          </div>
        </div>
      </div>

      <ol ref={list} className="space-y-24 lg:col-span-7 lg:space-y-[22vh] lg:py-[12vh]">
        {projects.map((p, i) => (
          <li key={p.slug} data-index={i}>
            <Link
              href={`/work/${p.slug}`}
              prefetch
              aria-label={`${p.title}: case study`}
              onFocus={() => setActive(i)}
              data-cursor="View project"
              className="block rounded-[10px]"
            >
              <div className="clip-reveal">
                <Tilt max={6}>
                  <ViewTransition name={`project-visual-${p.slug}`} share="morph" default="none">
                    <div>
                      <ProjectVisual project={p} priority={i === 0} sizes="(min-width: 1024px) 54vw, 92vw" />
                    </div>
                  </ViewTransition>
                </Tilt>
              </div>
            </Link>
            <div className="mt-8 lg:hidden">
              <Meta p={p} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
