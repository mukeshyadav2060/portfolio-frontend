import Image from "next/image";
import type { Profile } from "@/lib/types";
import { initialsOf } from "@/lib/format";
import { SplitWords } from "@/components/motion/split-words";
import { LocalTime } from "@/components/site/local-time";
import { Tilt } from "@/components/work/tilt";
import { ScrollLitText } from "./scroll-lit-text";

/** The uploaded portrait, or a typographic card in its place until one exists. */
function Portrait({ profile }: { profile: Profile }) {
  if (profile.avatarUrl) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-bg-3">
        <Image
          src={profile.avatarUrl}
          alt={`Portrait of ${profile.name}`}
          fill
          sizes="(min-width: 1024px) 34vw, 92vw"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${profile.name}, ${profile.role}`}
      className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[10px] bg-accent p-[8%] text-accent-ink"
    >
      <span className="text-sm font-medium">{profile.location}</span>
      <span aria-hidden className="pointer-events-none absolute -right-[6%] top-[12%] select-none font-display text-[clamp(10rem,24vw,22rem)] font-bold leading-none tracking-[-0.08em] opacity-[0.14]">
        {initialsOf(profile.name)}
      </span>
      <div>
        <p className="font-display text-[clamp(2.2rem,4vw,3.6rem)] font-bold leading-[0.92] tracking-[-0.045em]">{profile.name}</p>
        <p className="mt-3 text-lg font-medium opacity-80">{profile.role}</p>
      </div>
    </div>
  );
}

export function About({ profile }: { profile: Profile }) {
  const [lead, ...rest] = profile.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const city = profile.location.split(",")[0] || profile.location;

  return (
    <section id="about" aria-labelledby="about-title" className="frame section-gap relative grid gap-14 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <div className="clip-reveal">
            <Tilt max={5}>
              <Portrait profile={profile} />
            </Tilt>
          </div>
          <dl suppressHydrationWarning data-reveal className="mt-5 grid grid-cols-2 gap-4 rounded-[10px] bg-bg-2/80 p-5 text-base">
            <div>
              <dt className="text-sm text-ink-3">Local time</dt>
              <dd className="mt-0.5">
                <LocalTime timezone={profile.timezone} place={city} />
              </dd>
            </div>
            {profile.availability && (
              <div>
                <dt className="text-sm text-ink-3">Availability</dt>
                <dd className="mt-0.5">{profile.availability}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="lg:col-span-7 lg:pt-4">
        <SplitWords as="h2" id="about-title" text="About me" className="title" />
        <ScrollLitText
          text={lead ?? profile.intro}
          className="mt-10 text-[clamp(1.5rem,2.5vw,2.2rem)] font-medium leading-[1.25] tracking-[-0.025em]"
        />
        <div className="mt-10 max-w-2xl space-y-6 text-lg leading-relaxed text-ink">
          {rest.map((para, i) => (
            <p key={i} suppressHydrationWarning data-reveal style={{ "--d": i * 90 } as React.CSSProperties}>
              {para}
            </p>
          ))}
        </div>

        {(profile.education.length > 0 || profile.certifications.length > 0) && (
          <div className="mt-16 grid gap-10 md:grid-cols-2">
            {profile.education.length > 0 && (
              <div suppressHydrationWarning data-reveal>
                <h3 className="text-2xl font-bold tracking-[-0.03em]">Education</h3>
                <ul className="mt-5 space-y-5">
                  {profile.education.map((e) => (
                    <li key={e.degree + e.year}>
                      <p className="text-lg font-medium">{e.degree}</p>
                      <p className="mt-1 text-ink-2">{e.school}</p>
                      <p className="mt-1 text-sm text-ink-3">{[e.location, e.year].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.certifications.length > 0 && (
              <div suppressHydrationWarning data-reveal style={{ "--d": 100 } as React.CSSProperties}>
                <h3 className="text-2xl font-bold tracking-[-0.03em]">Certifications</h3>
                <ul className="mt-5 space-y-5">
                  {profile.certifications.map((c) => (
                    <li key={c.name}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="group text-lg font-medium">
                          <span className="link-draw">{c.name}</span>{" "}
                          <span aria-hidden className="inline-block text-accent transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <p className="text-lg font-medium">{c.name}</p>
                      )}
                      <p className="mt-1 text-sm text-ink-3">{[c.issuer, c.date].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
