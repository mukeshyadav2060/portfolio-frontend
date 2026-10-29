import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { cacheLife } from "next/cache";
import { ViewTransition } from "react";
import "./globals.css";
import { getPosts, getProfile, getProjects } from "@/lib/api";
import { initialsOf, siteUrl } from "@/lib/format";
import { theme } from "@/lib/theme";
import { Header, NAV } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CommandPalette, type Command } from "@/components/site/command-palette";
import { MotionRoot } from "@/components/motion/motion-root";
import { Cursor } from "@/components/motion/cursor";
import { ScrollTop } from "@/components/site/scroll-top";
import { ParticleField } from "@/components/particles/particle-field";

const sans = Geist({ variable: "--font-sans-face", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono-face", subsets: ["latin"], display: "swap", preload: false });
// Headings and display type; Geist stays for running text.
const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin"], display: "swap", weight: "variable" });

/**
 * Site-wide defaults. Each page sets its own title, description, canonical and social
 * tags through pageMetadata(); nothing page-specific (like a canonical) lives here, or
 * every page without one would inherit the home page's.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [p, posts] = await Promise.all([getProfile(), getPosts()]);
  const title = p.seoTitle || `${p.name} — ${p.role}`;
  const twitter = p.twitterHandle ? `@${p.twitterHandle}` : undefined;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${p.name}` },
    description: p.seoDescription || p.intro,
    applicationName: p.name,
    authors: [{ name: p.name, url: siteUrl() }],
    creator: p.name,
    publisher: p.name,
    keywords: p.seoKeywords.length ? p.seoKeywords : undefined,
    category: "technology",
    formatDetection: { telephone: false, email: false, address: false },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: { type: "website", siteName: p.name, locale: "en_US", title, description: p.seoDescription || p.intro, url: "/" },
    twitter: { card: "summary_large_image", creator: twitter, site: twitter },
    verification: {
      google: p.googleVerification || undefined,
      other: p.bingVerification ? { "msvalidate.01": p.bingVerification } : undefined,
    },
    alternates: posts.length ? { types: { "application/rss+xml": [{ url: "/blog/feed.xml", title: `${p.name} — Writing` }] } } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: theme.bg,
  colorScheme: "dark",
};

/** Dark text on light accents, light text on dark ones. */
function inkFor(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140 ? theme.bg : "#ffffff";
}

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// Marks the document as scripted so hidden entrance states apply; if the app never
// boots (blocked script, old browser), the class is removed and content shows as-is.
const bootScript = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__motionReady)document.documentElement.classList.remove('js')},4000)`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [profile, projects, posts, year] = await Promise.all([getProfile(), getProjects(), getPosts(), currentYear()]);
  const accent = theme.accent;
  // Writing only appears in navigation once something is published.
  const nav = posts.length ? NAV : NAV.filter((n) => n.id !== "writing");

  const commands: Command[] = [
    ...[
      ["Home", "/"],
      ["Work", "/#work"],
      ["About", "/#about"],
      ["Services", "/#services"],
      ["Experience", "/#experience"],
      ["Skills", "/#skills"],
      ...(posts.length ? [["Writing", "/blog"]] : []),
      ["Contact", "/#contact"],
    ].map(([label, href]) => ({ id: `nav-${label}`, label, href, group: "Go to" })),
    ...projects.map((p) => ({ id: `p-${p.slug}`, label: p.title, hint: p.year, href: `/work/${p.slug}`, group: "Projects" })),
    ...posts.map((p) => ({ id: `b-${p.slug}`, label: p.title, href: `/blog/${p.slug}`, group: "Writing" })),
    { id: "copy-email", label: `Copy email · ${profile.email}`, copy: profile.email, group: "Contact" },
    ...(profile.resumeUrl ? [{ id: "cv", label: "Download CV", href: "/cv", external: true, group: "Contact" }] : []),
    ...profile.socials.map((s) => ({ id: `s-${s.label}`, label: s.label, href: s.url, external: true, group: "Elsewhere" })),
  ];

  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}
      style={{ "--accent": accent, "--accent-ink": inkFor(accent) } as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <ParticleField
          accent={accent}
          initials={initialsOf(profile.name)}
        />
        <Header profile={profile} nav={nav} />
        <ViewTransition>
          <main id="main" tabIndex={-1} className="relative z-10 outline-none">
            {children}
          </main>
        </ViewTransition>
        <Footer profile={profile} year={year} nav={nav} />
        <CommandPalette commands={commands} />
        <ScrollTop />
        <Cursor />
        <MotionRoot />
      </body>
    </html>
  );
}
