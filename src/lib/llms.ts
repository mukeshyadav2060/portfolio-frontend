import "server-only";
import { getPost, getPosts, getProject, getProjects, getSite } from "./api";
import { formatDate, formatMonth } from "./format";
import { absoluteUrl } from "./seo";
import type { Experience } from "./types";

/**
 * llms.txt (https://llmstxt.org): a Markdown map of the site for AI assistants and
 * answer engines. The short file links out; llms-full.txt inlines every page's content.
 */

/** Pushes headings inside page content below the "### Title" each item gets here. */
const nest = (md: string) => md.replace(/^#{1,3}\s/gm, "#### ");

const role = (e: Experience) => `${e.role}, ${e.company} (${formatMonth(e.startDate)} – ${formatMonth(e.endDate)})`;

export async function llmsTxt({ full }: { full: boolean }) {
  const [site, projects, posts] = await Promise.all([getSite(), getProjects(), getPosts()]);
  const { profile } = site;
  const current = site.experience.find((e) => !e.endDate);
  const out: string[] = [];

  out.push(`# ${profile.name}`, "", `> ${profile.seoDescription || profile.intro}`, "");
  out.push(
    [
      `- Role: ${profile.role}${current ? ` at ${current.company}` : ""}`,
      profile.location && `- Location: ${profile.location} (${profile.timezone})`,
      `- Availability: ${profile.availability || (profile.availableForWork ? "Open to new work" : "Not currently taking work")}`,
      `- Email: ${profile.email}`,
      `- Website: ${absoluteUrl("/")}`,
      profile.alternateNames.length > 0 && `- Also known as: ${profile.alternateNames.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n"),
    "",
  );

  if (full && profile.about) out.push("## About", "", profile.about, "");

  out.push("## Pages", "");
  out.push(`- [Home](${absoluteUrl("/")}): profile, services, experience, skills and contact`);
  out.push(`- [Work](${absoluteUrl("/work")}): all projects and case studies`);
  if (posts.length) out.push(`- [Writing](${absoluteUrl("/blog")}): articles and notes`);
  if (profile.resumeUrl) out.push(`- [CV](${absoluteUrl("/cv")}): latest résumé (PDF)`);
  out.push("");

  out.push("## Projects", "");
  if (full) {
    const details = await Promise.all(projects.map((p) => getProject(p.slug)));
    for (const p of details) {
      if (!p) continue;
      out.push(`### [${p.title}](${absoluteUrl(`/work/${p.slug}`)})`, "");
      out.push(
        [
          `- Summary: ${p.summary}`,
          p.role && `- Role: ${p.role}`,
          p.client && `- Client: ${p.client}`,
          p.year && `- Year: ${p.year}`,
          p.stack.length > 0 && `- Stack: ${p.stack.join(", ")}`,
          p.liveUrl && `- Live: ${p.liveUrl}`,
          p.repoUrl && `- Source: ${p.repoUrl}`,
          ...p.metrics.map((m) => `- ${m.label}: ${m.value}`),
        ]
          .filter(Boolean)
          .join("\n"),
        "",
      );
      if (p.content) out.push(nest(p.content), "");
    }
  } else {
    for (const p of projects) {
      const meta = [p.category, p.year, p.client && `at ${p.client}`].filter(Boolean).join(", ");
      out.push(`- [${p.title}](${absoluteUrl(`/work/${p.slug}`)}): ${p.summary}${meta ? ` (${meta})` : ""}`);
    }
    out.push("");
  }

  out.push("## Experience", "");
  for (const e of site.experience) {
    out.push(`- ${role(e)}${e.location ? `, ${e.location}` : ""}${e.summary ? `: ${e.summary}` : ""}`);
    if (full) for (const h of e.highlights) out.push(`  - ${h}`);
  }
  out.push("");

  if (site.services.length) {
    out.push("## Services", "");
    for (const s of site.services) out.push(`- ${s.title}: ${s.summary}`);
    out.push("");
  }

  if (site.skills.length) {
    out.push("## Skills", "");
    for (const g of site.skills) out.push(`- ${g.category}: ${g.items.map((s) => s.name).join(", ")}`);
    out.push("");
  }

  if (profile.education.length || profile.certifications.length) {
    out.push("## Education and certifications", "");
    for (const e of profile.education) out.push(`- ${e.degree}, ${e.school}${e.location ? `, ${e.location}` : ""} (${e.year})`);
    for (const c of profile.certifications) out.push(`- ${c.url ? `[${c.name}](${c.url})` : c.name}${c.issuer ? `, ${c.issuer}` : ""} (${c.date})`);
    out.push("");
  }

  if (posts.length) {
    out.push("## Writing", "");
    if (full) {
      const details = await Promise.all(posts.map((p) => getPost(p.slug)));
      for (const p of details) {
        if (!p) continue;
        out.push(`### [${p.title}](${absoluteUrl(`/blog/${p.slug}`)})`, "", `Published ${formatDate(p.publishedAt)}.`, "", nest(p.content), "");
      }
    } else {
      for (const p of posts) out.push(`- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.excerpt}`);
      out.push("");
    }
  }

  out.push("## Optional", "");
  if (!full) out.push(`- [Full content](${absoluteUrl("/llms-full.txt")}): every case study and article in one file`);
  for (const s of profile.socials) out.push(`- [${s.label}](${s.url})`);
  out.push("");

  return out.join("\n");
}

export const textResponse = (body: string) =>
  new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
