import type { Experience as Role } from "@/lib/types";
import { duration, formatMonth } from "@/lib/format";
import { SplitWords } from "@/components/motion/split-words";
import { ScrollLine } from "./scroll-line";

export function Experience({ roles, today }: { roles: Role[]; today: string }) {
  if (roles.length === 0) return null;
  const first = roles.reduce((min, r) => (r.startDate < min ? r.startDate : min), roles[0].startDate);
  const years = Math.max(1, Math.floor(((Number(today.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(today.slice(5, 7)) - Number(first.slice(5, 7))) / 12));

  return (
    <section id="experience" aria-labelledby="experience-title" className="frame section-gap relative grid gap-14 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <SplitWords as="h2" id="experience-title" text="Experience" className="title" />
          <p suppressHydrationWarning data-reveal className="mt-6 max-w-xs text-lg text-ink-2">
            {years}+ years across {roles.length} {roles.length === 1 ? "role" : "roles"}, from first commit to production.
          </p>
        </div>
      </div>

      <ol className="relative lg:col-span-8">
        <ScrollLine />
        {roles.map((r) => (
          <li key={r.id} className="relative pb-16 pl-10 last:pb-0 md:pl-14">
            <span
              aria-hidden
              className={`absolute left-0 top-2 size-2.75 -translate-x-1.25 rounded-full ${r.endDate ? "bg-ink-3" : "pulse-dot bg-accent"}`}
            />
            <div suppressHydrationWarning data-reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="subtitle">
                {r.role}{" "}
                <span className="text-ink-2">
                  at{" "}
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="link-draw text-ink">
                      {r.company}
                    </a>
                  ) : (
                    <span className="text-ink">{r.company}</span>
                  )}
                </span>
              </h3>
              <p className="text-sm tabular-nums text-ink-2">
                {formatMonth(r.startDate)} – {formatMonth(r.endDate)} · {duration(r.startDate, r.endDate, today)}
              </p>
            </div>
            <p suppressHydrationWarning data-reveal className="mt-2 text-sm text-ink-3" style={{ "--d": 60 } as React.CSSProperties}>
              {[r.employmentType, r.location].filter(Boolean).join(" · ")}
            </p>
            {r.summary && (
              <p suppressHydrationWarning data-reveal className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ "--d": 120 } as React.CSSProperties}>
                {r.summary}
              </p>
            )}
            {r.highlights.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {r.highlights.map((h, j) => (
                  <li key={h} suppressHydrationWarning data-reveal className="flex max-w-2xl gap-3 text-ink-2" style={{ "--d": 160 + j * 60 } as React.CSSProperties}>
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            )}
            {r.stack.length > 0 && (
              <p suppressHydrationWarning data-reveal className="tag mt-5 text-ink-3" style={{ "--d": 240 } as React.CSSProperties}>
                {r.stack.join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
