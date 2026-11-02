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

/**
 * Live GitHub contribution graph, served from the backend's hourly cache. Hidden when not
 * configured or when there is no contribution data to show.
 */
export async function Activity() {
  const gh = await getGithub();
  if (!gh || gh.calendars.length === 0) return null;

  return (
    <section id="activity" aria-labelledby="activity-title" className="frame section-gap relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitWords as="h2" id="activity-title" text="In the open" className="title" />
        <a href={gh.profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          <span>@{gh.username} on GitHub ↗</span>
        </a>
      </div>

      <div suppressHydrationWarning data-reveal="fade" className="mt-14">
        <ContributionGraph calendars={compact(gh.calendars)} profileUrl={gh.profileUrl} />
      </div>
    </section>
  );
}
