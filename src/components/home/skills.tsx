import type { SkillGroup } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";

export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section id="skills" aria-labelledby="skills-title" className="relative z-10 bg-bg-2 section-gap">
      <div className="frame">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SplitWords as="h2" id="skills-title" text="Toolkit" className="title" />
          <p suppressHydrationWarning data-reveal className="max-w-sm text-lg text-ink-2">
            What I reach for, and how well I know it.
          </p>
        </div>
        <div className="mt-10 grid gap-x-12 gap-y-10 md:mt-16 md:grid-cols-2 md:gap-y-14 lg:mt-20 lg:grid-cols-3">
          {groups.map((g, gi) => (
            <div key={g.category}>
              <h3 suppressHydrationWarning data-reveal className="subtitle" style={{ "--d": gi * 90 } as React.CSSProperties}>
                {g.category}
              </h3>
              {/* Phones: two columns of compact rows; from md up, the original single column. */}
              <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 md:mt-7 md:block md:space-y-4">
                {g.items.map((s, i) => (
                  <li key={s.name} suppressHydrationWarning data-reveal className="group min-w-0" style={{ "--d": gi * 90 + i * 50 } as React.CSSProperties}>
                    <div className="flex items-baseline justify-between gap-2 text-[0.9375rem] md:text-lg">
                      <span className="transition-colors group-hover:text-accent">{s.name}</span>
                      <span className="text-sm tabular-nums text-ink-3">{s.level}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10" role="meter" aria-label={`${s.name} proficiency`} aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100}>
                      <div className="skill-fill h-full origin-left rounded-full bg-accent" style={{ "--level": s.level / 100 } as React.CSSProperties} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
