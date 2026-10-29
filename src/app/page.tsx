import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { getSite } from "@/lib/api";
import { absoluteUrl, graph, ids, pageMetadata, personNode, projectUrl, websiteNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { Hero } from "@/components/home/hero";
import { SkillWall } from "@/components/home/skill-wall";
import { About } from "@/components/home/about";
import { Services } from "@/components/home/services";
import { Work } from "@/components/home/work";
import { Experience } from "@/components/home/experience";
import { Skills } from "@/components/home/skills";
import { Activity } from "@/components/home/activity";
import { Writing } from "@/components/home/writing";
import { Contact } from "@/components/home/contact";

async function today() {
  "use cache";
  cacheLife("days");
  return new Date().toISOString().slice(0, 10);
}

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite();
  return pageMetadata(profile, {
    title: profile.seoTitle || `${profile.name} — ${profile.role}`,
    description: profile.seoDescription || profile.intro,
    path: "/",
    absolute: true,
    keywords: profile.seoKeywords,
  });
}

export default async function Home() {
  const [site, now] = await Promise.all([getSite(), today()]);
  const { profile } = site;

  // A ProfilePage whose main entity is the person, as Google expects for portfolio pages.
  const jsonLd = graph(websiteNode(profile), personNode(profile, site.experience, site.skills), {
    "@type": "ProfilePage",
    "@id": `${absoluteUrl("/")}/#profilepage`,
    url: absoluteUrl("/"),
    name: profile.seoTitle || `${profile.name} — ${profile.role}`,
    description: profile.seoDescription || profile.intro,
    inLanguage: "en",
    isPartOf: { "@id": ids.website() },
    mainEntity: { "@id": ids.person() },
    dateModified: profile.updatedAt,
    primaryImageOfPage: `${absoluteUrl("/")}/opengraph-image`,
    hasPart: site.projects.map((p) => ({ "@type": "CreativeWork", name: p.title, url: projectUrl(p) })),
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <Hero profile={profile} />
      <SkillWall items={site.skills.flatMap((g) => g.items.map((s) => ({ ...s, category: g.category })))} />
      <About profile={profile} />
      <Services services={site.services} />
      <Work projects={site.projects} />
      <Experience roles={site.experience} today={now} />
      <Skills groups={site.skills} />
      <Suspense fallback={null}>
        <Activity />
      </Suspense>
      <Writing posts={site.posts} />
      <Contact profile={profile} />
    </>
  );
}
