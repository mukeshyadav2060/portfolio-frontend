import { getProfile, getProject } from "@/lib/api";
import { ogCard, ogSize, uploadedOg } from "@/lib/og";

export const alt = "Project case study";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, profile] = await Promise.all([getProject(slug), getProfile()]);
  if (!p) return ogCard(profile, { kicker: "Work", title: profile.name });
  return (
    (await uploadedOg(p.ogImage)) ??
    ogCard(profile, {
      kicker: ["Case study", p.category, p.year].filter(Boolean).join(" · "),
      title: p.title,
      subtitle: p.summary.length > 140 ? `${p.summary.slice(0, 137).replace(/\s+\S*$/, "")}…` : p.summary,
      tags: p.stack,
    })
  );
}
