const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-03" → "Mar 2024" */
export function formatMonth(ym: string | null) {
  if (!ym) return "Present";
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function duration(start: string, end: string | null, now: string) {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = (end ?? now.slice(0, 7)).split("-").map(Number);
  const months = Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, m && `${m} mo`].filter(Boolean).join(" ");
}

export const statusLabel: Record<string, string> = {
  production: "In production",
  "open-source": "Open source",
  "in-progress": "In progress",
  archived: "Archived",
  concept: "Concept",
};

/** First and last name: "Mukesh Kumar Yadav" → "MY" */
export const initialsOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  return [words[0], words.length > 1 ? words[words.length - 1] : undefined]
    .filter(Boolean)
    .map((w) => w![0]!.toUpperCase())
    .join("");
};

/**
 * The canonical origin, without a trailing slash. Every canonical link, sitemap entry and
 * structured-data URL is built from it, so production must set NEXT_PUBLIC_SITE_URL;
 * Vercel's production domain is the fallback.
 */
export const siteUrl = () => {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
};
