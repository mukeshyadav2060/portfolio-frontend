import Image from "next/image";
import type { ProjectCard } from "@/lib/types";

/**
 * The project's cover image, or — until one is uploaded — a typographic poster of the
 * project set in its own accent colour (never a fake screenshot).
 */
export function ProjectVisual({ project, priority = false, sizes = "(min-width: 1024px) 50vw, 92vw" }: { project: ProjectCard; priority?: boolean; sizes?: string }) {
  if (project.coverImage) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-bg-3">
        <Image src={project.coverImage} alt={`${project.title} — ${project.summary}`} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const accent = project.accent ?? "var(--accent)";
  return (
    <div
      role="img"
      aria-label={`${project.title}: ${project.category}`}
      className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-[10px] p-[6%] [container-type:inline-size]"
      style={{ background: accent, color: "#07080a" }}
    >
      <div className="flex justify-between text-[clamp(0.7rem,1vw,0.95rem)] font-medium">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>
      <div>
        {/* Sized against the poster's own width (cqw) so long titles still fit on one line. */}
        <div
          className="whitespace-nowrap font-display font-bold leading-[0.85] tracking-[-0.06em]"
          style={{ fontSize: `min(16cqw, ${(150 / Math.max(project.title.length, 5)).toFixed(1)}cqw)` }}
        >
          {project.title}
        </div>
        <div className="mt-[4%] flex flex-wrap gap-x-4 gap-y-1 text-[clamp(0.7rem,0.95vw,0.9rem)] font-medium opacity-75">
          {project.stack.slice(0, 5).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
      {/* One large cropped initial as the poster's motif. */}
      <span aria-hidden className="pointer-events-none absolute -right-[4%] -top-[18%] select-none font-display text-[52cqw] font-bold leading-none tracking-[-0.08em] opacity-[0.12]">
        {project.title.charAt(0)}
      </span>
    </div>
  );
}
