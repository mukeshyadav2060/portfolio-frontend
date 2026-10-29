import type { NextConfig } from "next";

const backend = new URL(process.env.BACKEND_URL ?? "http://localhost:4000");
const isLocalBackend = ["localhost", "127.0.0.1"].includes(backend.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  cacheLife: {
    // Content changes are pushed by the backend's revalidation webhook, so cached
    // entries can live long; the revalidate window only bounds a missed webhook.
    content: { stale: 300, revalidate: 3600, expire: 60 * 60 * 24 * 30 },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: backend.protocol.replace(":", "") as "http" | "https",
        hostname: backend.hostname,
        port: backend.port,
        pathname: "/uploads/**",
      },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    // Only needed when the backend runs on this machine during development.
    dangerouslyAllowLocalIP: isLocalBackend && process.env.NODE_ENV !== "production",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
