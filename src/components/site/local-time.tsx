"use client";

import { useNow } from "@/lib/hooks";

/** Live clock in the owner's time zone, with the offset from the visitor. */
export function LocalTime({ timezone, place }: { timezone: string; place: string }) {
  const now = useNow(60_000);
  if (!now) return <span className="tabular-nums">{place}</span>;

  let time = "";
  let diff = "";
  try {
    time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(now);
    const there = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const here = new Date(now.toLocaleString("en-US"));
    const hours = Math.round(((there.getTime() - here.getTime()) / 36e5) * 2) / 2;
    diff = hours === 0 ? "same time as you" : `${Math.abs(hours)}h ${hours > 0 ? "ahead of" : "behind"} you`;
  } catch {
    return <span>{place}</span>;
  }

  return (
    <span className="tabular-nums">
      {time} in {place} <span className="text-ink-3">· {diff}</span>
    </span>
  );
}
