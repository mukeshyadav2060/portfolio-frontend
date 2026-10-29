import type { Profile } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { LocalTime } from "@/components/site/local-time";
import { ContactForm } from "./contact-form";
import { CopyEmail } from "./copy-email";

export function Contact({ profile }: { profile: Profile }) {
  const city = profile.location.split(",")[0] || profile.location;
  return (
    <section id="contact" aria-labelledby="contact-title" className="frame section-gap relative min-h-screen">
      <SplitWords as="h2" id="contact-title" text="Let’s build something." className="display max-w-[12ch]" />
      <p suppressHydrationWarning data-reveal className="mt-8 max-w-xl text-xl leading-relaxed text-ink-2">
        {profile.availability || "Tell me about the product, the timeline and what success looks like."} I reply within two working days.
      </p>

      <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
        <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
          <div suppressHydrationWarning data-reveal>
            <p className="font-display text-sm text-ink-3">Email</p>
            <CopyEmail email={profile.email} />
          </div>
          {profile.phone && (
            <div suppressHydrationWarning data-reveal>
              <p className="font-display text-sm text-ink-3">Phone</p>
              <a href={`tel:${profile.phone.replace(/\s+/g, "")}`} className="link-draw mt-2 inline-block text-xl">
                {profile.phone}
              </a>
            </div>
          )}
          <div suppressHydrationWarning data-reveal>
            <p className="font-display text-sm text-ink-3">Local time</p>
            <p className="mt-2 text-xl">
              <LocalTime timezone={profile.timezone} place={city} />
            </p>
          </div>
          {profile.socials.length > 0 && (
            <div suppressHydrationWarning data-reveal>
              <p className="font-display text-sm text-ink-3">Elsewhere</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost h-11 px-5 text-sm">
                      <span>{s.label} ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
