"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * One calendar, compacted on the server (see activity.tsx): daily counts and levels in
 * order from `start`, an ISO date falling on weekday `first` (0 = Sunday). About a tenth
 * of the size of day objects, which keeps the page payload and hydration light.
 */
export type CompactCalendar = { key: string; label: string; total: number; start: string; first: number; counts: number[]; levels: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 864e5;
const dateAt = (start: string, i: number) => new Date(Date.parse(`${start}T00:00:00Z`) + i * DAY_MS);
const fmt = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// Five shared style objects instead of one per cell.
const LEVEL_STYLE = [0, 1, 2, 3, 4].map((l) => ({ background: `color-mix(in srgb, var(--accent) ${l * 25}%, var(--bg-3))` }));

function stats(counts: number[]) {
  let longest = 0;
  let run = 0;
  let best = -1;
  let active = 0;
  counts.forEach((c, i) => {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (c > 0) active++;
    if (c > (counts[best] ?? 0)) best = i;
  });
  let current = 0;
  for (let i = counts.length - 1; i >= 0; i--) {
    // Today with no contributions yet doesn't break the streak.
    if (counts[i] === 0 && i === counts.length - 1) continue;
    if (counts[i] === 0) break;
    current++;
  }
  return { active, longest, current, best };
}

/** The squares. Memoised: hovering changes only the caption, never re-renders this grid. */
const Grid = memo(function Grid({ cal, label, onHover }: { cal: CompactCalendar; label: string; onHover: (i: number | null) => void }) {
  const weeks = Math.ceil((cal.first + cal.counts.length) / 7);
  const cells = [];
  for (let i = 0; i < cal.counts.length; i++) {
    const slot = cal.first + i;
    cells.push(
      <span
        key={i}
        data-i={i}
        className="aspect-square rounded-[3px] hover:outline-1 hover:outline-ink/60"
        style={{ ...LEVEL_STYLE[Number(cal.levels[i]) || 0], gridColumn: Math.floor(slot / 7) + 1, gridRow: (slot % 7) + 1 }}
      />,
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className="grid flex-1 grid-rows-7 gap-0.75"
      style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
      onPointerOver={(e) => {
        const i = (e.target as HTMLElement).dataset.i;
        onHover(i === undefined ? null : Number(i));
      }}
      onPointerLeave={() => onHover(null)}
    >
      {cells}
    </div>
  );
});

/**
 * GitHub-style contribution graph with a year filter. All years arrive with the page, so
 * switching is instant. Cells scale to the panel width; phones scroll sideways.
 */
export function ContributionGraph({ calendars, profileUrl }: { calendars: CompactCalendar[]; profileUrl: string }) {
  const [key, setKey] = useState(calendars[0]?.key ?? "last");
  const [hover, setHover] = useState<number | null>(null);
  const cal = calendars.find((c) => c.key === key) ?? calendars[0];
  const onHover = useCallback((i: number | null) => setHover(i), []);

  const months = useMemo(() => {
    // A label above the column holding each month's 1st, plus the opening month if there's room.
    const out: { col: number; label: string }[] = [];
    for (let i = 0; i < cal.counts.length; i++) {
      const d = dateAt(cal.start, i);
      if (d.getUTCDate() === 1 || i === 0) out.push({ col: Math.floor((cal.first + i) / 7), label: MONTHS[d.getUTCMonth()] });
    }
    return out.filter((m, idx) => idx !== 0 || out.length < 2 || out[1].col - m.col >= 3);
  }, [cal]);
  const weeks = Math.ceil((cal.first + cal.counts.length) / 7);
  const s = useMemo(() => stats(cal.counts), [cal]);
  const period = cal.key === "last" ? "in the last year" : `in ${cal.label}`;

  // Narrow screens scroll: start at the latest weeks, as GitHub does. Switching years
  // replays one wipe on the grid wrapper (a single animated element).
  const scroller = useRef<HTMLDivElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wipe.current?.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
        duration: 650,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    }
  }, [key]);

  const caption =
    hover !== null
      ? `${plural(cal.counts[hover], "contribution")} on ${fmt(dateAt(cal.start, hover))}`
      : s.best >= 0 && cal.counts[s.best] > 0
        ? `Busiest day: ${cal.counts[s.best]} on ${fmt(dateAt(cal.start, s.best))}`
        : "No contributions in this period.";

  return (
    <div className="rounded-2xl bg-bg-2/80 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg">
          <span className="font-display text-2xl font-bold tabular-nums tracking-tight">{cal.total.toLocaleString("en")}</span>{" "}
          <span className="text-ink-2">contributions {period}</span>
        </p>
        <div role="tablist" aria-label="Contribution year" className="flex flex-wrap gap-1 rounded-md bg-bg p-1">
          {calendars.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={c.key === key}
              onClick={() => {
                setKey(c.key);
                setHover(null);
              }}
              className="rounded px-3 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink aria-selected:bg-bg-3 aria-selected:text-ink"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="mt-6 overflow-x-auto overscroll-x-contain pb-1">
        <div ref={wipe} className="min-w-170">
          {/* Month labels, aligned to the week columns. */}
          <div className="relative ml-9 h-5 text-[0.8125rem] text-ink-3">
            {months.map((m) => (
              <span key={`${m.col}-${m.label}`} className="absolute top-0" style={{ left: `${(m.col / weeks) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="grid w-7 shrink-0 grid-rows-7 gap-0.75 text-[0.8125rem] leading-none text-ink-3" aria-hidden>
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="flex items-center">
                  {d}
                </span>
              ))}
            </div>
            <Grid cal={cal} label={`${cal.total} contributions ${period}`} onHover={onHover} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
        <p aria-live="polite" className="min-h-5">
          {caption}
        </p>
        <span className="flex items-center gap-1.5 text-ink-3" aria-hidden>
          Less
          {LEVEL_STYLE.map((style, l) => (
            <span key={l} className="size-2.75 rounded-[3px]" style={style} />
          ))}
          More
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Active days", `${s.active}`],
          ["Longest streak", plural(s.longest, "day")],
          cal.key === "last" ? ["Current streak", plural(s.current, "day")] : ["Per active day", s.active ? (cal.total / s.active).toFixed(1) : "0"],
          ["Busiest day", s.best >= 0 ? `${cal.counts[s.best]}` : "0"],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse rounded-[10px] bg-bg p-4">
            <dt className="mt-1 text-sm text-ink-3">{label}</dt>
            <dd className="font-display text-2xl font-bold tabular-nums tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="sr-only focus:not-sr-only">
        Full contribution history on GitHub
      </a>
    </div>
  );
}
