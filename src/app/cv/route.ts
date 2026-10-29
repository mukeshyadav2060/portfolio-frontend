import { getProfile } from "@/lib/api";

/** Stable, shareable /cv link that always points at the latest uploaded résumé. */
export async function GET() {
  const { resumeUrl } = await getProfile();
  if (!resumeUrl) return new Response("No CV has been uploaded yet.", { status: 404 });
  return Response.redirect(resumeUrl, 307);
}
