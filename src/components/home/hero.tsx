import Link from "next/link";
import type { Profile } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { Magnetic } from "@/components/motion/magnetic";
import { RotatingWord } from "./rotating-word";

export function Hero({ profile }: { profile: Profile }) {
  const words = profile.headline.split(/\s+/).length;
  return (
    <section id="top" aria-labelledby="hero-title" className="frame relative flex min-h-[100svh] flex-col justify-end pb-10 pt-32 md:pb-14">
      <div className="max-w-[min(100%,74rem)]">
        <p className="fade-up flex items-center gap-3 text-sm text-ink-2" style={{ "--d": 50 } as React.CSSProperties}>
          <span className={`size-2 rounded-full ${profile.availableForWork ? "pulse-dot bg-accent" : "bg-ink-3"}`} aria-hidden />
          {profile.availableForWork ? "Available for work" : "Currently booked"}
          {profile.location && <span className="text-ink-3">· {profile.location}</span>}
        </p>

        <h1 id="hero-title" className="mt-7 max-w-[11.5em] text-[clamp(3.1rem,7.8vw,8.75rem)] font-semibold leading-[0.9] tracking-[-0.048em]">
          <span className="sr-only">
            {profile.name}, {profile.role}.{" "}
          </span>
          <SplitWords text={profile.headline} immediate />
        </h1>

        <div className="mt-9 grid max-w-3xl gap-6 md:mt-11">
          <p className="lede fade-up text-ink-2" style={{ "--d": 250 + words * 70 } as React.CSSProperties}>
            <span className="text-ink">{profile.name}</span> — {profile.intro}
          </p>
          {profile.heroWords.length > 0 && (
            <p className="fade-up text-lg text-ink" style={{ "--d": 350 + words * 70 } as React.CSSProperties}>
              {profile.role} working in <RotatingWord words={profile.heroWords} />
            </p>
          )}
        </div>

        <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ "--d": 450 + words * 70 } as React.CSSProperties}>
          <Magnetic>
            <Link href="/#work" className="btn btn-primary">
              <span>See the work</span>
              <span aria-hidden>↓</span>
            </Link>
          </Magnetic>
          <Magnetic>
            {profile.resumeUrl ? (
              <a href="/cv" target="_blank" rel="noopener" className="btn btn-ghost">
                <span>Download CV</span>
              </a>
            ) : (
              <Link href="/#contact" className="btn btn-ghost">
                <span>Get in touch</span>
              </Link>
            )}
          </Magnetic>
        </div>
      </div>

      <div className="mt-16 flex items-end justify-between gap-8 md:mt-24">
        {profile.stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-10 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-14">
            {profile.stats.map((s, i) => (
              <div key={s.label} className="fade-up" style={{ "--d": 700 + i * 90 } as React.CSSProperties}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">{s.value}</dd>
                <dd className="mt-1 max-w-[14rem] text-sm text-ink-2">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}
        <Link href="/#about" className="group hidden shrink-0 flex-col items-center gap-3 text-[0.8125rem] text-ink-2 md:flex" aria-label="Scroll to about">
          Scroll
          <span className="relative h-14 w-px overflow-hidden bg-ink/15">
            <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-accent" />
          </span>
        </Link>
      </div>
    </section>
  );
}
