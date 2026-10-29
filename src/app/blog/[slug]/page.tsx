import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPost, getPosts, getProfile } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";
import { absoluteUrl, breadcrumbNode, clip, graph, ids, pageMetadata, postUrl } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import { SplitWords } from "@/components/motion/split-words";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [p, profile] = await Promise.all([getPost(slug), getProfile()]);
  if (!p) return { title: "Post not found" };
  return pageMetadata(profile, {
    title: p.seoTitle || p.title,
    description: p.seoDescription || clip(p.excerpt || p.content),
    path: `/blog/${p.slug}`,
    keywords: [...p.seoKeywords, ...p.tags],
    article: { publishedTime: p.publishedAt, modifiedTime: p.updatedAt, tags: [...p.seoKeywords, ...p.tags] },
  });
}

async function Article({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const [post, profile] = await Promise.all([getPost(slug), getProfile()]);
  if (!post) notFound();
  const html = await renderMarkdown(post.content);

  const url = postUrl(post);
  const jsonLd = graph(
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline: post.title,
      description: post.seoDescription || clip(post.excerpt || post.content),
      image: post.ogImage ?? post.coverImage ?? `${url}/opengraph-image`,
      datePublished: post.publishedAt ?? undefined,
      dateModified: post.updatedAt,
      author: { "@type": "Person", "@id": ids.person(), name: profile.name, url: absoluteUrl("/") },
      publisher: { "@type": "Person", "@id": ids.person(), name: profile.name, url: absoluteUrl("/") },
      keywords: [...post.seoKeywords, ...post.tags].join(", ") || undefined,
      articleSection: post.tags[0],
      wordCount: post.content.split(/\s+/).filter(Boolean).length,
      timeRequired: `PT${post.readingMinutes}M`,
      inLanguage: "en",
      isPartOf: { "@id": `${absoluteUrl("/blog")}#blog` },
    },
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "Writing", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
  );

  return (
    <article className="pb-32">
      <JsonLd data={jsonLd} />
      <header className="frame pb-14 pt-40 md:pt-48">
        <Link href="/blog" className="fade-up text-sm text-ink-2 hover:text-ink">
          ← All writing
        </Link>
        <h1 className="mt-8 max-w-[18ch] text-[clamp(2.6rem,6.4vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          <SplitWords text={post.title} immediate />
        </h1>
        <p className="fade-up mt-8 flex flex-wrap gap-x-4 gap-y-1 text-ink-2" style={{ "--d": 400 } as React.CSSProperties}>
          <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
          <span>· {post.readingMinutes} min read</span>
          {post.tags.length > 0 && <span>· {post.tags.join(", ")}</span>}
        </p>
      </header>
      {post.coverImage && (
        <div className="frame">
          <div className="fade-up relative aspect-[2/1] overflow-hidden rounded-[20px] bg-bg-3">
            <Image src={post.coverImage} alt={post.title} fill priority sizes="92vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="frame mt-16">
        <div className="prose mx-auto fade-up" style={{ "--d": 500 } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  );
}

export default function PostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<div className="frame min-h-screen pt-48" aria-busy="true" />}>
      <Article params={props.params} />
    </Suspense>
  );
}
