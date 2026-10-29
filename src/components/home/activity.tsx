import { getGithub } from "@/lib/api";
import type { ContributionCalendar } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { ContributionGraph, type CompactCalendar } from "./contribution-graph";

function compact(calendars: ContributionCalendar[]): CompactCalendar[] {
  return calendars.map((c) => {
    const days = c.weeks.flat();
    return {
      key: c.key,
      label: c.label,
      total: c.total,
      start: days[0]?.date ?? "",
      first: days[0]?.weekday ?? 0,
      counts: days.map((d) => d.count),
      levels: days.map((d) => d.level).join(""),
    };
  });
}

/** Live GitHub activity, served from the backend's hourly cache. Hidden when not configured. */
export async function Activity() {
  const gh = await getGithub();
  if (!gh) return null;

  return (
    <section id="activity" aria-labelledby="activity-title" className="frame section-gap relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitWords as="h2" id="activity-title" text="In the open" className="title" />
        <a href={gh.profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          <span>@{gh.username} on GitHub ↗</span>
        </a>
      </div>

      {gh.calendars.length > 0 && (
        <div suppressHydrationWarning data-reveal="fade" className="mt-14">
          <ContributionGraph calendars={compact(gh.calendars)} profileUrl={gh.profileUrl} />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-3 md:gap-6">
        {[
          ["Public repositories", gh.publicRepos],
          ["Stars earned", gh.totalStars],
          ["Followers", gh.followers],
        ].map(([label, value], i) => (
          <div key={label as string} suppressHydrationWarning data-reveal className="flex flex-col-reverse rounded-2xl bg-bg-2/80 p-5 md:p-6" style={{ "--d": i * 70 } as React.CSSProperties}>
            <dt className="mt-1 text-sm text-ink-2">{label}</dt>
            <dd className="font-display text-3xl font-bold tabular-nums tracking-tight md:text-4xl">{Number(value).toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {gh.languages.length > 0 && (
          <div suppressHydrationWarning data-reveal className="rounded-2xl bg-bg-2/80 p-6">
            <h3 className="text-sm text-ink-2">Languages across repositories</h3>
            <ul className="mt-5 space-y-3">
              {gh.languages.map((l) => (
                <li key={l.name}>
                  <div className="flex justify-between text-base">
                    <span>{l.name}</span>
                    <span className="tabular-nums text-ink-2">{l.share}%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/10">
                    <div className="skill-fill h-full origin-left rounded-full bg-accent" style={{ "--level": l.share / 100 } as React.CSSProperties} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {gh.topRepos.length > 0 && (
          <ul suppressHydrationWarning data-reveal className="grid gap-3 sm:grid-cols-2" style={{ "--d": 120 } as React.CSSProperties}>
            {gh.topRepos.map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-2xl bg-bg-2/80 p-5 transition-colors hover:bg-bg-3">
                  <span className="font-medium transition-colors group-hover:text-accent">{r.name} ↗</span>
                  {r.description && <span className="mt-2 line-clamp-2 text-sm text-ink-2">{r.description}</span>}
                  <span className="mt-auto pt-4 text-[0.8125rem] text-ink-3">
                    {[r.language, `★ ${r.stars}`].filter(Boolean).join(" · ")}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
