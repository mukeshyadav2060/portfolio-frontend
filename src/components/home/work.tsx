import Link from "next/link";
import type { ProjectCard } from "@/lib/types";
import { SplitWords } from "@/components/motion/split-words";
import { WorkGallery } from "./work-gallery";

export function Work({ projects }: { projects: ProjectCard[] }) {
  if (projects.length === 0) return null;
  return (
    <section id="work" aria-labelledby="work-title" className="frame section-gap relative">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SplitWords as="h2" id="work-title" text="Selected work" className="title" />
        <Link href="/work" className="link-draw text-lg text-ink-2 hover:text-ink">
          All projects →
        </Link>
      </div>
      <div className="mt-16 lg:mt-12">
        <WorkGallery projects={projects} />
      </div>
    </section>
  );
}
