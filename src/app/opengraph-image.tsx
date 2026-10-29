import { getProfile } from "@/lib/api";
import { ogCard, ogSize, uploadedOg } from "@/lib/og";

export const alt = "Portfolio of a full stack developer: selected work, experience and writing";
export const size = ogSize;
export const contentType = "image/png";

export default async function OpengraphImage() {
  const p = await getProfile();
  return (
    (await uploadedOg(p.ogImage)) ??
    ogCard(p, { kicker: p.location ? `${p.role} · ${p.location}` : p.role, title: p.name, subtitle: p.headline, tags: p.heroWords })
  );
}
