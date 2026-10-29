import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { getProfile, getProjects } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import { absoluteUrl, breadcrumbNode, clip, graph, ids, pageMetadata, projectUrl } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { ProjectVisual } from "@/components/work/project-visual";
import { Tilt } from "@/components/work/tilt";

export async function generateMetadata(): Promise<Metadata> {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  return pageMetadata(profile, {
    title: "Projects & case studies",
    description: clip(`Projects and case studies by ${profile.name}, ${profile.role.toLowerCase()}: ${projects.map((p) => p.title).join(", ")}.`),
    path: "/work",
    keywords: [...new Set(projects.flatMap((p) => p.stack))].slice(0, 12),
  });
}

/** "8 projects: 5 for clients and employers, 3 of my own. …" — split by whether a client is set. */
function workIntro(projects: Awaited<ReturnType<typeof getProjects>>) {
  const forClients = projects.filter((p) => p.client).length;
  const own = projects.length - forClients;
  const parts = [forClients && `${forClients} for clients and employers`, own && `${own} of my own`].filter(Boolean);
  return `${projects.length} projects${parts.length ? `: ${parts.join(", ")}` : ""}. Each one links to a short case study.`;
}

export default async function WorkIndex() {
  const projects = await getProjects();
  const jsonLd = graph(
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl("/work")}#page`,
      url: absoluteUrl("/work"),
      name: "Projects & case studies",
      isPartOf: { "@id": ids.website() },
      about: { "@id": ids.person() },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: projectUrl(p), name: p.title })),
      },
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
    ]),
  );
  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader title="Work" intro={workIntro(projects)} />
      <ul className="frame grid gap-x-8 gap-y-20 pb-32 md:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.slug} suppressHydrationWarning data-reveal className={i % 3 === 0 ? "md:col-span-2" : ""} style={{ "--d": (i % 2) * 90 } as React.CSSProperties}>
            <Link href={`/work/${p.slug}`} prefetch className="group block" data-cursor="View project">
              <Tilt max={5}>
                <ViewTransition name={`project-visual-${p.slug}`} share="morph" default="none">
                  <div className="overflow-hidden rounded-[20px]">
                    <div className="transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]">
                      <ProjectVisual project={p} priority={i === 0} sizes={i % 3 === 0 ? "92vw" : "(min-width: 768px) 46vw, 92vw"} />
                    </div>
                  </div>
                </ViewTransition>
              </Tilt>
              <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <ViewTransition name={`project-title-${p.slug}`} share="morph" default="none">
                  <h2 className="text-[clamp(1.8rem,3.4vw,3rem)] font-semibold leading-none tracking-[-0.035em] transition-colors group-hover:text-accent">
                    {p.title}
                  </h2>
                </ViewTransition>
                <span className="text-sm text-ink-2">
                  {[p.category, p.year, statusLabel[p.status]].filter(Boolean).join(" · ")}
                </span>
              </div>
              <p className="mt-3 max-w-xl text-lg text-ink-2">{p.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
