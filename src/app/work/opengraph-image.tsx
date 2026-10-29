import { getProfile, getProjects } from "@/lib/api";
import { ogCard, ogSize } from "@/lib/og";

export const alt = "Projects and case studies";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  return ogCard(profile, {
    kicker: `Work · ${projects.length} projects`,
    title: "Projects & case studies",
    subtitle: projects.slice(0, 4).map((p) => p.title).join(" · "),
    tags: [...new Set(projects.flatMap((p) => p.stack))],
  });
}
