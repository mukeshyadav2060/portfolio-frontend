import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/format";

/**
 * Everything public is open to every crawler, including AI search and assistant bots
 * (they cite and link portfolios). Only the internal API routes are off limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
