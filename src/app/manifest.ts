import type { MetadataRoute } from "next";
import { getProfile } from "@/lib/api";
import { initialsOf } from "@/lib/format";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const p = await getProfile();
  return {
    name: `${p.name} — ${p.role}`,
    short_name: initialsOf(p.name) || p.name,
    description: p.seoDescription || p.intro,
    start_url: "/",
    display: "standalone",
    background_color: "#07080a",
    theme_color: "#07080a",
    categories: ["portfolio", "technology"],
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
