import type { MetadataRoute } from "next";
import { getPosts, getProfile, getProjects } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

const latest = (dates: (string | null | undefined)[]) => dates.filter(Boolean).sort().at(-1) ?? undefined;

/** Accurate lastModified dates are the signal Google actually uses; priority is mostly ignored. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, projects, posts] = await Promise.all([getProfile(), getProjects(), getPosts()]);
  const workUpdated = latest(projects.map((p) => p.updatedAt));
  const blogUpdated = latest(posts.map((p) => p.updatedAt));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latest([profile.updatedAt, workUpdated, blogUpdated]),
      changeFrequency: "weekly",
      priority: 1,
      images: [profile.avatarUrl ?? `${absoluteUrl("/")}/opengraph-image`],
    },
    { url: absoluteUrl("/work"), lastModified: workUpdated, changeFrequency: "monthly", priority: 0.9 },
    ...projects.map((p) => ({
      url: absoluteUrl(`/work/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [p.coverImage ?? absoluteUrl(`/work/${p.slug}/opengraph-image`)],
    })),
    // The writing index stays out until something is published (it is noindex while empty).
    ...(posts.length ? [{ url: absoluteUrl("/blog"), lastModified: blogUpdated, changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [p.coverImage ?? absoluteUrl(`/blog/${p.slug}/opengraph-image`)],
    })),
  ];
}
