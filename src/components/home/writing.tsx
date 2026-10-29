import Link from "next/link";
import type { PostCard } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { SplitWords } from "@/components/motion/split-words";

/** `heading` keeps the outline right: h2 on /blog, h3 under the home page's "Writing" h2. */
export function PostList({ posts, heading: Heading = "h2" }: { posts: PostCard[]; heading?: "h2" | "h3" }) {
  return (
    <ul>
      {posts.map((p, i) => (
        <li key={p.slug} suppressHydrationWarning data-reveal style={{ "--d": i * 80 } as React.CSSProperties}>
          <Link
            href={`/blog/${p.slug}`}
            className="group relative grid gap-3 py-8 transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid-cols-12 md:items-baseline md:gap-8 md:hover:pl-6"
          >
            <span aria-hidden className="absolute inset-0 -z-10 origin-bottom scale-y-0 rounded-2xl bg-bg-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
            <time dateTime={p.publishedAt ?? undefined} className="text-sm tabular-nums text-ink-3 md:col-span-2">
              {formatDate(p.publishedAt)}
            </time>
            <div className="md:col-span-8">
              <Heading className="block font-sans text-[clamp(1.5rem,2.6vw,2.4rem)] font-medium leading-[1.1] tracking-[-0.025em] transition-colors group-hover:text-accent">
                {p.title}
              </Heading>
              {p.excerpt && <span className="mt-2 block max-w-2xl text-ink-2">{p.excerpt}</span>}
            </div>
            <span className="flex items-center justify-between gap-4 text-sm text-ink-3 md:col-span-2 md:justify-end">
              {p.readingMinutes} min read
              <span aria-hidden className="text-xl text-ink transition-transform duration-500 group-hover:-rotate-45">
                →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Writing({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="writing" aria-labelledby="writing-title" className="frame section-gap relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitWords as="h2" id="writing-title" text="Writing" className="title" />
        <Link href="/blog" className="link-draw text-lg text-ink-2 hover:text-ink">
          All posts →
        </Link>
      </div>
      <div className="mt-12">
        <PostList posts={posts} heading="h3" />
      </div>
    </section>
  );
}
