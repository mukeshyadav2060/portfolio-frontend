import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { GithubActivity, Post, PostCard, Profile, Project, ProjectCard, Site } from "./types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export class NotFoundError extends Error {}

/**
 * Every read goes through here. Results are cached with `'use cache'` in the callers and
 * tagged so the backend's webhook (/api/revalidate) can refresh exactly what changed.
 */
// Generous in development, where the backend compiles each route on first request.
const TIMEOUT_MS = process.env.NODE_ENV === "production" ? 10_000 : 60_000;

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Re-throw as a plain Error: DOMException's read-only `message` trips Next's error overlay.
    throw new Error(`Backend unreachable at ${BACKEND_URL} (${path}): ${(error as Error).name}`);
  }
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`Backend ${path} responded ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function getSite(): Promise<Site> {
  "use cache";
  cacheLife("content");
  cacheTag("site", "profile", "projects", "experience", "services", "skills", "posts");
  return get<Site>("/site");
}

export async function getProfile(): Promise<Profile> {
  "use cache";
  cacheLife("content");
  cacheTag("profile");
  return get<Profile>("/profile");
}

export async function getProjects(): Promise<ProjectCard[]> {
  "use cache";
  cacheLife("content");
  cacheTag("projects");
  return get<ProjectCard[]>("/projects");
}

/** Returns null for an unknown slug so pages can call notFound(). */
export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("content");
  cacheTag("projects", `project:${slug}`);
  try {
    return await get<Project>(`/projects/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

export async function getPosts(): Promise<PostCard[]> {
  "use cache";
  cacheLife("content");
  cacheTag("posts");
  return get<PostCard[]>("/posts");
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("content");
  cacheTag("posts", `post:${slug}`);
  try {
    return await get<Post>(`/posts/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

/** GitHub data changes slowly and the backend caches it too; never fail the page over it. */
export async function getGithub(): Promise<GithubActivity | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("github", "profile");
  try {
    return await get<GithubActivity>("/github");
  } catch {
    cacheLife("minutes");
    return null;
  }
}

/** Server-side proxy for the contact form, so the browser never talks to the backend directly. */
export async function postContact(payload: Record<string, string>, visitorIp: string | null) {
  const res = await fetch(`${BACKEND_URL}/api/v1/contact`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-integration-secret": process.env.REVALIDATE_SECRET ?? "dev-revalidate-secret",
      ...(visitorIp ? { "x-visitor-ip": visitorIp } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body } as {
    ok: boolean;
    status: number;
    body: { data?: unknown; error?: { message: string; details?: Record<string, string[]> | null } } | null;
  };
}
