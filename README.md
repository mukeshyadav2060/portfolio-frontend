# Portfolio — Frontend

The public portfolio site, built with **Next.js 16**, React 19 and Tailwind CSS 4.

Every word, project, post and setting on the site comes from the
[portfolio backend](https://github.com/mukeshyadav2060/portfolio-backend) API. Pages are
prerendered to static HTML and refreshed on demand when content changes in the admin
panel, so editing content never needs a rebuild or redeploy.

## Features

- Home, `/work` (projects and case studies), `/blog` and contact pages
- WebGL particle field (no three.js), scroll-driven animations, Lenis smooth scrolling,
  view transitions and a ⌘K command palette. All motion respects `prefers-reduced-motion`.
- Contact form (a server action that proxies to the backend)
- Live GitHub section ("In the open") when a GitHub username is set in the admin profile
- SEO: per-page metadata, JSON-LD structured data, generated Open Graph images,
  `robots.txt`, `sitemap.xml`, RSS (`/blog/feed.xml`), `manifest.webmanifest`,
  `llms.txt` and `llms-full.txt`

## Requirements

- Node.js 20.9 or newer
- A running backend. The frontend reads from it **at build time** as well as at runtime.

## Getting started

```bash
npm install
cp .env.example .env.local    # then edit the values
npm run dev                   # http://localhost:3000
```

Start the backend first (`http://localhost:4000` by default).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `BACKEND_URL` | Yes | Base URL of the backend, e.g. `https://api.example.com`. Server-side only. |
| `NEXT_PUBLIC_SITE_URL` | Yes (production) | Public URL of this site, `https://` and no trailing slash. Canonical links, the sitemap, OG tags and structured data are built from it. |
| `REVALIDATE_SECRET` | Yes | Shared secret with the backend. Authenticates revalidation webhooks and the contact proxy. Must match the backend exactly. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (needs the backend to be reachable) |
| `npm run start` | Serve the production build on port 3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## How content stays fresh

- **Reads.** Every fetcher in `src/lib/api.ts` is a `'use cache'` function with a cache tag.
  Pages prerender at build time. Projects and posts that were not built yet get an instant
  shell and fill in on the first visit.
- **Writes.** After every admin create, update or delete, the backend sends the affected tags
  to `POST /api/revalidate` on this site (authenticated with `REVALIDATE_SECRET`). The next
  visit regenerates only those entries.
- As a safety net, cached entries also revalidate every hour in case a webhook is missed.

## Deploying to Vercel

1. Deploy the backend first. This site's build fetches content from it.
2. Import this repository in Vercel. The framework preset is **Next.js** and the default
   build settings work as they are.
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy, then set the backend's `FRONTEND_URL` and `CORS_ORIGINS` to this site's URL.
5. After launch, add the site to Google Search Console and Bing Webmaster Tools, paste their
   verification codes into the admin Profile, and submit `/sitemap.xml`.

## Project structure

```
src/
  app/          routes, metadata, OG images, sitemap, robots, RSS, /api/revalidate
  components/   UI sections, motion and the particle engine
  lib/          API client (api.ts), SEO helpers (seo.ts), formatting
```
