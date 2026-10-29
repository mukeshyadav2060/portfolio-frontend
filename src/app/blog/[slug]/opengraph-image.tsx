import { getPost, getProfile } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ogCard, ogSize, uploadedOg } from "@/lib/og";

export const alt = "Article";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, profile] = await Promise.all([getPost(slug), getProfile()]);
  if (!post) return ogCard(profile, { kicker: "Writing", title: profile.name });
  return (
    (await uploadedOg(post.ogImage)) ??
    ogCard(profile, {
      kicker: ["Writing", formatDate(post.publishedAt), `${post.readingMinutes} min read`].filter(Boolean).join(" · "),
      title: post.title,
      tags: post.tags,
    })
  );
}
