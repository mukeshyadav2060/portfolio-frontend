import { ImageResponse } from "next/og";
import type { Profile } from "./types";
import { siteUrl } from "./format";
import { theme } from "./theme";

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
  const accent = theme.accent;
  const host = siteUrl().replace(/^https?:\/\//, "");
  const long = card.title.length > 38;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: theme.bg, color: theme.ink, padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: theme.ink2 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
          {card.kicker}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: long ? 76 : 104, fontWeight: 700, letterSpacing: long ? -3 : -5, lineHeight: 1 }}>{card.title}</div>
          {card.subtitle && <div style={{ marginTop: 28, fontSize: 34, color: theme.ink2, maxWidth: 1000, lineHeight: 1.3 }}>{card.subtitle}</div>}
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: theme.ink2 }}>
          <div style={{ display: "flex", color: theme.ink }}>
            {profile.name} · {profile.role}
          </div>
          <div style={{ display: "flex" }}>{host}</div>
        </div>
      </div>
    ),
    ogSize,
  );
}

type Vec3 = [number, number, number];

/**
 * The hero's impossible triangle as flat shaded polygons in a 100×100 box: three square
 * beams at right angles, seen along (1, 1, 1) and painted far to near. The beams are slimmer
 * than the hero's so the hole stays open at favicon size.
 */
function penroseFaces() {
  const [L, W] = [6, 1];
  const view = ([x, y, z]: Vec3): Vec3 => [(-x + 2 * y - z) / -Math.sqrt(6), (-x + z) / Math.SQRT2, -(x + y + z) / Math.sqrt(3)];
  const boxes: [Vec3, Vec3][] = [
    [[0, 0, 0], [L + W, W, W]],
    [[L, 0, 0], [L + W, L + W, W]],
    [[L, L, 0], [L + W, L + W, L + W]],
  ];
  // The +y face of each beam is its lit top; the other two its sides in light and shade.
  const fills = ["#0a8fa8", theme.accent, "#064a5a"];
  const faces = boxes.flatMap(([lo, hi]) =>
    [0, 1, 2].map((axis) => {
      const [a, b] = [0, 1, 2].filter((k) => k !== axis);
      const quad = [[lo[a], lo[b]], [hi[a], lo[b]], [hi[a], hi[b]], [lo[a], hi[b]]].map(([u, v]) => {
        const p: Vec3 = [0, 0, 0];
        p[axis] = hi[axis];
        p[a] = u;
        p[b] = v;
        return view(p);
      });
      return { quad, depth: quad.reduce((s, p) => s + p[2], 0) / 4, fill: fills[axis] };
    }),
  );
  faces.sort((f, g) => g.depth - f.depth);
  const pts = faces.flatMap((f) => f.quad);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const k = 72 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const [cx, cy] = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
  return faces.map((f) => ({ fill: f.fill, points: f.quad.map(([x, y]) => `${(50 + (x - cx) * k).toFixed(2)},${(50 - (y - cy) * k).toFixed(2)}`).join(" ") }));
}

/**
 * The site mark for favicons and the app icon. `rounded` gives the browser icon its corners;
 * Apple rounds its own icons and wants them square and opaque.
 */
export function iconMark(size: number, rounded = true) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: theme.bg, borderRadius: rounded ? size * 0.2 : 0 }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {penroseFaces().map((f) => (
            <polygon key={f.points} points={f.points} fill={f.fill} stroke={theme.bg} strokeWidth={0.6} strokeLinejoin="round" />
          ))}
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
