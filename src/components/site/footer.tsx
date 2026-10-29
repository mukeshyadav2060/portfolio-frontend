import Link from "next/link";
import type { Profile } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { LocalTime } from "./local-time";
import type { NavItem } from "./header";

export function Footer({ profile, year, nav }: { profile: Profile; year: number; nav: NavItem[] }) {
  const city = profile.location.split(",")[0] || profile.location;
  return (
    <footer className="relative z-10 overflow-hidden bg-bg-2 pt-24">
      <div className="frame grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="subtitle max-w-md">Have something worth building? I’d like to hear about it.</p>
          <a href={`mailto:${profile.email}`} className="link-draw mt-6 inline-block text-lg text-accent">
            {profile.email}
          </a>
        </div>
        <nav aria-label="Footer">
          <p className="font-display text-sm text-ink-3">Pages</p>
          <ul className="mt-4 space-y-2">
            {nav.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="link-draw">
                  {n.label}
                </Link>
              </li>
            ))}
            {profile.resumeUrl && (
              <li>
                <a href="/cv" className="link-draw">
                  CV
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div>
          <p className="font-display text-sm text-ink-3">Elsewhere</p>
          <ul className="mt-4 space-y-2">
            {profile.socials.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-draw">
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="frame mt-20 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-2">
        <LocalTime timezone={profile.timezone} place={city} />
        <span>
          © {year} {profile.name}
        </span>
      </div>

      {/* The name returns at full width as the page's close. */}
      {/* Sized from the name's length so any name spans the width without overflowing. */}
      <div aria-hidden className="mt-8 select-none px-[var(--gutter)]" style={{ fontSize: `${Math.min(15.5, 165 / Math.max(profile.name.length, 1)).toFixed(2)}vw` }}>
        <SplitWords
          text={profile.name}
          className="block whitespace-nowrap text-center font-display font-bold leading-[0.8] tracking-[-0.06em] text-ink"
        />
      </div>
    </footer>
  );
}
