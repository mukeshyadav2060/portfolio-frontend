import { ImageResponse } from "next/og";
import type { Profile } from "./types";
import { siteUrl } from "./format";

export const ogSize = { width: 1200, height: 630 };

/**
 * A share image uploaded in the admin wins; it is served from this site's own URL so the
 * og:image link never points at the backend. Returns null when there is none (or it fails).
 */
export async function uploadedOg(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return new Response(await res.arrayBuffer(), {
      headers: { "content-type": res.headers.get("content-type") ?? "image/png", "cache-control": "public, max-age=86400, immutable" },
    });
  } catch {
    return null;
  }
}

/** The generated 1200×630 card: kicker, big title, one line of context, name and site. */
export function ogCard(profile: Profile, card: { kicker: string; title: string; subtitle?: string; tags?: string[] }) {
  const accent = /^#[0-9a-f]{6}$/i.test(profile.accent) ? profile.accent : "#c6ff3d";
  const host = siteUrl().replace(/^https?:\/\//, "");
  const long = card.title.length > 38;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080a", color: "#eef0f2", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#a9adb5" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
          {card.kicker}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: long ? 76 : 104, fontWeight: 700, letterSpacing: long ? -3 : -5, lineHeight: 1 }}>{card.title}</div>
          {card.subtitle && <div style={{ marginTop: 28, fontSize: 34, color: "#a9adb5", maxWidth: 1000, lineHeight: 1.3 }}>{card.subtitle}</div>}
          {card.tags && card.tags.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              {card.tags.slice(0, 5).map((t) => (
                <div key={t} style={{ display: "flex", fontSize: 24, color: accent, border: `2px solid ${accent}55`, borderRadius: 999, padding: "6px 18px" }}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#a9adb5" }}>
          <div style={{ display: "flex", color: "#eef0f2" }}>
            {profile.name} · {profile.role}
          </div>
          <div style={{ display: "flex" }}>{host}</div>
        </div>
      </div>
    ),
    ogSize,
  );
}

/** The initials mark used for favicons and the app icon. */
export function iconMark(profile: Profile, initials: string, size: number) {
  const accent = /^#[0-9a-f]{6}$/i.test(profile.accent) ? profile.accent : "#c6ff3d";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: accent, color: "#07080a", fontSize: size * 0.46, fontWeight: 700, letterSpacing: -size * 0.02, borderRadius: size * 0.2 }}>
        {initials}
      </div>
    ),
    { width: size, height: size },
  );
}
