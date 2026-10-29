import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getProfile, getProject, getProjects } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { statusLabel } from "@/lib/format";
import { breadcrumbNode, clip, graph, ids, pageMetadata, projectUrl } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { ProjectVisual } from "@/components/work/project-visual";
import { SplitWords } from "@/components/motion/split-words";

export async function generateStaticParams() {
  const projects = await getProjects();
  // Same placeholder rule as the blog: never return an empty list under Cache Components.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [p, profile] = await Promise.all([getProject(slug), getProfile()]);
  if (!p) return { title: "Project not found" };
  return pageMetadata(profile, {
    title: p.seoTitle || `${p.title}: ${p.category}`,
    description: p.seoDescription || clip(p.summary),
    path: `/work/${p.slug}`,
    keywords: [...p.seoKeywords, ...p.stack],
    article: { modifiedTime: p.updatedAt, tags: p.stack },
  });
}

/** Splits a before/after metric such as "60–70 → 99" into its two sides. */
function splitChange(value: string) {
  const match = value.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
  return match ? { from: match[1], to: match[2] } : null;
}

async function CaseStudy({ params }: { params: PageProps<"/work/[slug]">["params"] }) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();
  const html = p.content ? await renderMarkdown(p.content) : "";
  const url = projectUrl(p);

  const jsonLd = graph(
    {
      "@type": "CreativeWork",
      "@id": `${url}#work`,
      url,
      name: p.title,
      headline: p.seoTitle || `${p.title}: ${p.category}`,
      description: p.seoDescription || p.summary,
      abstract: p.summary,
      genre: p.category,
      image: p.ogImage ?? p.coverImage ?? `${url}/opengraph-image`,
      creator: { "@id": ids.person() },
      author: { "@id": ids.person() },
      dateCreated: /^\d{4}$/.test(p.year) ? p.year : undefined,
      dateModified: p.updatedAt,
      inLanguage: "en",
      keywords: [...p.seoKeywords, ...p.stack].join(", ") || undefined,
      isPartOf: { "@id": ids.website() },
      mainEntityOfPage: url,
      sourceOrganization: p.client ? { "@type": "Organization", name: p.client } : undefined,
      about: p.liveUrl ? { "@type": "WebSite", name: p.title, url: p.liveUrl } : undefined,
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
      { name: p.title, path: `/work/${p.slug}` },
    ]),
  );

  const facts = [
    ["Role", p.role],
    ["Client", p.client],
    ["Year", p.year],
    ["Status", statusLabel[p.status]],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <article>
      <JsonLd data={jsonLd} />
      <header className="frame pb-14 pt-40 md:pt-48">
        <Link href="/work" className="fade-up text-sm text-ink-2 hover:text-ink">
          ← All work
        </Link>
        <ViewTransition name={`project-title-${p.slug}`} share="morph" default="none">
          <h1 className="mt-8 text-[clamp(3.25rem,10vw,10rem)] font-semibold leading-[0.85] tracking-[-0.055em]">
            <SplitWords text={p.title} immediate />
          </h1>
        </ViewTransition>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <p className="subtitle fade-up text-ink lg:col-span-7" style={{ "--d": 300 } as React.CSSProperties}>
            {p.summary}
          </p>
          <dl className="fade-up grid grid-cols-2 gap-6 lg:col-span-4 lg:col-start-9" style={{ "--d": 420 } as React.CSSProperties}>
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-ink-3">{k}</dt>
                <dd className="mt-1 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {(p.liveUrl || p.repoUrl) && (
          <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ "--d": 500 } as React.CSSProperties}>
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <span>Visit live site ↗</span>
              </a>
            )}
            {p.repoUrl && (
              <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <span>Source code ↗</span>
              </a>
            )}
          </div>
        )}
      </header>

      <div className="frame">
        <ViewTransition name={`project-visual-${p.slug}`} share="morph" default="none">
          <div className="fade-up" style={{ "--d": 200 } as React.CSSProperties}>
            <ProjectVisual project={p} priority sizes="92vw" />
          </div>
        </ViewTransition>
      </div>

      {p.metrics.length > 0 && (
        <dl className="frame mt-20 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-8">
          {p.metrics.map((m, i) => {
            const change = splitChange(m.value);
            return (
              <div key={m.label} suppressHydrationWarning data-reveal className="flex min-w-0 flex-col-reverse" style={{ "--d": i * 80 } as React.CSSProperties}>
                <dt className="mt-2 text-sm text-ink-2 md:text-base">{m.label}</dt>
                <dd className="text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-none tracking-[-0.04em] text-accent wrap-anywhere">
                  {/* "60–70 → 99" reads as the result, with the starting point as a quiet line above it. */}
                  {change ? (
                    <>
                      <span className="mb-2 block text-sm font-medium tracking-normal text-ink-2 tabular-nums md:text-base">from {change.from}</span>
                      <span className="sr-only"> to </span>
                      {change.to}
                    </>
                  ) : (
                    m.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <div className="frame mt-20 grid gap-12 pb-24 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            <h2 className="text-sm text-ink-3">Stack</h2>
            <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:items-start">
              {p.stack.map((s) => (
                <li key={s} className="tag rounded-full bg-bg-3 px-3 py-1.5 text-ink-2">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        {html && <div suppressHydrationWarning data-reveal className="prose lg:col-span-8 lg:col-start-5" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>

      {p.gallery.length > 0 && (
        <div className="frame grid gap-6 pb-24 md:grid-cols-2">
          {p.gallery.map((src, i) => (
            <div key={src} suppressHydrationWarning data-reveal className={`relative aspect-[16/10] overflow-hidden rounded-[20px] bg-bg-3 ${i % 3 === 0 ? "md:col-span-2" : ""}`}>
              <Image src={src} alt={`${p.title} screenshot ${i + 1}`} fill sizes={i % 3 === 0 ? "92vw" : "46vw"} className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {p.next && (
        <Link href={`/work/${p.next.slug}`} prefetch className="group block bg-bg-2 py-24 md:py-36">
          <div className="frame">
            <span className="text-ink-2">Next project</span>
            <span className="mt-4 flex items-center justify-between gap-6">
              <span className="title transition-colors group-hover:text-accent">{p.next.title}</span>
              <span aria-hidden className="text-[clamp(2.5rem,6vw,5.5rem)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4">
                →
              </span>
            </span>
          </div>
        </Link>
      )}
    </article>
  );
}

export default function ProjectPage(props: PageProps<"/work/[slug]">) {
  return (
    <Suspense fallback={<div className="frame min-h-screen pt-48" aria-busy="true" />}>
      <CaseStudy params={props.params} />
    </Suspense>
  );
}
