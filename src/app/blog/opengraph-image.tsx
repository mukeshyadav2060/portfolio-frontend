import { getPosts, getProfile } from "@/lib/api";
import { ogCard, ogSize } from "@/lib/og";

export const alt = "Writing";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  const [profile, posts] = await Promise.all([getProfile(), getPosts()]);
  return ogCard(profile, {
    kicker: `Writing${posts.length ? ` · ${posts.length} articles` : ""}`,
    title: "Notes on building for the web",
    subtitle: posts[0]?.title,
    tags: [...new Set(posts.flatMap((p) => p.tags))],
  });
}
