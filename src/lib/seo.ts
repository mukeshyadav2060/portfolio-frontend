import type { Metadata } from "next";
import type { Experience, PostCard, Profile, ProjectCard, SkillGroup } from "./types";
import { siteUrl } from "./format";

/** "/work/x" → "https://site.com/work/x"; "/" → the bare origin, matching Next's canonical. */
export const absoluteUrl = (path = "/") => (path === "/" ? siteUrl() : `${siteUrl()}${path}`);

/** Stable node ids so every page's structured data describes the same person and site. */
export const ids = {
  person: () => `${siteUrl()}/#person`,
  website: () => `${siteUrl()}/#website`,
};

/** Plain text for meta descriptions: no Markdown, single-spaced, cut at a word under `max`. */
export function clip(text: string, max = 160) {
  const plain = text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–—-]+$/, "")}…`;
}

const nonEmpty = <T>(list: T[]) => (list.length ? list : undefined);

/**
 * Complete metadata for one page. Next replaces `openGraph` and `twitter` wholesale per
 * segment, so every page sets both in full rather than inheriting the home page's.
 * Images come from the colocated `opengraph-image` files, which Twitter cards reuse.
 */
export function pageMetadata(
  profile: Profile,
  page: {
    title: string;
    description: string;
    path: string;
    /** The home page uses its title as-is; other pages get "— Name" appended. */
    absolute?: boolean;
    keywords?: string[];
    article?: { publishedTime?: string | null; modifiedTime?: string; tags?: string[] };
    noindex?: boolean;
  },
): Metadata {
  const social = page.absolute ? page.title : `${page.title} — ${profile.name}`;
  const twitter = profile.twitterHandle ? `@${profile.twitterHandle}` : undefined;
  return {
    title: page.absolute ? { absolute: page.title } : page.title,
    description: page.description,
    keywords: nonEmpty(page.keywords ?? []),
    alternates: { canonical: page.path },
    openGraph: {
      title: social,
      description: page.description,
      url: page.path,
      siteName: profile.name,
      locale: "en_US",
      ...(page.article
        ? {
            type: "article",
            publishedTime: page.article.publishedTime ?? undefined,
            modifiedTime: page.article.modifiedTime,
            authors: [absoluteUrl("/")],
            tags: nonEmpty(page.article.tags ?? []),
          }
        : { type: page.path === "/" ? "profile" : "website" }),
    },
    twitter: { card: "summary_large_image", title: social, description: page.description, creator: twitter, site: twitter },
    ...(page.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ── Structured data (schema.org JSON-LD) ─────────────────────────────────────────── */

type Node = Record<string, unknown>;

/** One @graph per page: the site and the person always, plus whatever the page describes. */
export const graph = (...nodes: Node[]) => ({ "@context": "https://schema.org", "@graph": nodes });

export function websiteNode(profile: Profile): Node {
  return {
    "@type": "WebSite",
    "@id": ids.website(),
    url: absoluteUrl("/"),
    name: profile.name,
    alternateName: nonEmpty([...profile.alternateNames, `${profile.name} portfolio`]),
    description: profile.seoDescription || profile.intro,
    inLanguage: "en",
    publisher: { "@id": ids.person() },
    author: { "@id": ids.person() },
  };
}

export function personNode(profile: Profile, experience: Experience[], skills: SkillGroup[]): Node {
  const words = profile.name.split(/\s+/).filter(Boolean);
  const [city, ...rest] = profile.location.split(",").map((s) => s.trim());
  const country = rest.at(-1);
  const current = experience.filter((e) => !e.endDate);
  const github = profile.githubUsername ? `https://github.com/${profile.githubUsername}` : null;
  const sameAs = [...new Set([...profile.socials.map((s) => s.url), ...(github ? [github] : [])])];
  return {
    "@type": "Person",
    "@id": ids.person(),
    name: profile.name,
    alternateName: nonEmpty(profile.alternateNames),
    givenName: words[0],
    familyName: words.length > 1 ? words.at(-1) : undefined,
    jobTitle: profile.role,
    description: profile.seoDescription || profile.intro,
    url: absoluteUrl("/"),
    mainEntityOfPage: absoluteUrl("/"),
    image: profile.avatarUrl ?? `${absoluteUrl("/")}/opengraph-image`,
    email: `mailto:${profile.email}`,
    telephone: profile.phone ?? undefined,
    address: city ? { "@type": "PostalAddress", addressLocality: city, addressCountry: country } : undefined,
    homeLocation: city ? { "@type": "Place", name: profile.location } : undefined,
    worksFor: nonEmpty(current.map((e) => ({ "@type": "Organization", name: e.company, url: e.url ?? undefined }))),
    hasOccupation: {
      "@type": "Occupation",
      name: profile.role,
      occupationLocation: city ? { "@type": "City", name: profile.location } : undefined,
      skills: nonEmpty(skills.flatMap((g) => g.items.map((s) => s.name)))?.join(", "),
    },
    alumniOf: nonEmpty(
      profile.education.map((e) => ({
        "@type": "CollegeOrUniversity",
        name: e.school,
        address: e.location || undefined,
      })),
    ),
    hasCredential: nonEmpty(
      profile.certifications.map((c) => ({
        "@type": "EducationalOccupationalCredential",
        name: c.name,
        credentialCategory: "certificate",
        url: c.url,
        recognizedBy: c.issuer ? { "@type": "Organization", name: c.issuer } : undefined,
      })),
    ),
    knowsAbout: nonEmpty([...new Set([...skills.flatMap((g) => g.items.map((s) => s.name)), ...profile.heroWords])]),
    sameAs: nonEmpty(sameAs),
  };
}

export function breadcrumbNode(trail: { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absoluteUrl(t.path) })),
  };
}

export const projectUrl = (p: Pick<ProjectCard, "slug">) => absoluteUrl(`/work/${p.slug}`);
export const postUrl = (p: Pick<PostCard, "slug">) => absoluteUrl(`/blog/${p.slug}`);
