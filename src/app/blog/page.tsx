import type { Metadata } from "next";
import { getPosts, getProfile } from "@/lib/api";
import { absoluteUrl, breadcrumbNode, graph, ids, pageMetadata, postUrl } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { PostList } from "@/components/home/writing";

const INTRO = "Notes on performance, architecture and the small details that make interfaces feel right.";

export async function generateMetadata(): Promise<Metadata> {
  const [profile, posts] = await Promise.all([getProfile(), getPosts()]);
  return pageMetadata(profile, {
    title: "Writing",
    description: `Articles by ${profile.name} on Next.js, web performance, technical SEO and building fast web products.`,
    path: "/blog",
    keywords: [...new Set(posts.flatMap((p) => p.tags))],
    // An empty index is thin content; keep it out of search until something is published.
    noindex: posts.length === 0,
  });
}

export default async function BlogIndex() {
  const posts = await getPosts();
  const jsonLd = graph(
    {
      "@type": "Blog",
      "@id": `${absoluteUrl("/blog")}#blog`,
      url: absoluteUrl("/blog"),
      name: "Writing",
      description: INTRO,
      inLanguage: "en",
      isPartOf: { "@id": ids.website() },
      author: { "@id": ids.person() },
      publisher: { "@id": ids.person() },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: postUrl(p),
        datePublished: p.publishedAt ?? undefined,
        dateModified: p.updatedAt,
        author: { "@id": ids.person() },
      })),
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Writing", path: "/blog" },
    ]),
  );
  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader title="Writing" intro={INTRO} />
      <div className="frame pb-32">
        {posts.length ? <PostList posts={posts} /> : <p className="text-lg text-ink-2">Nothing published yet.</p>}
      </div>
    </>
  );
}
