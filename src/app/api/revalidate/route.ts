import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

const SECRET = process.env.REVALIDATE_SECRET ?? "dev-revalidate-secret";
const TAG = /^(profile|projects|experience|services|skills|posts|github|site|project:[a-z0-9-]+|post:[a-z0-9-]+)$/;

function authorized(header: string | null) {
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the backend after every admin write with the cache tags that changed. */
export async function POST(request: Request) {
  if (!authorized(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string" && TAG.test(t)) : [];
  if (tags.length === 0) return Response.json({ error: "No valid tags" }, { status: 400 });

  // The home page reads everything through one aggregate entry.
  for (const tag of new Set([...tags, "site"])) revalidateTag(tag, "max");
  return Response.json({ revalidated: [...new Set([...tags, "site"])] });
}
