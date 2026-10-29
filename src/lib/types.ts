/** Mirrors the backend's public API (see backend/src/lib/queries.ts). */
export type LinkItem = { label: string; url: string };
export type Metric = { label: string; value: string };

export type Profile = {
  name: string;
  handle: string;
  role: string;
  headline: string;
  heroWords: string[];
  intro: string;
  about: string;
  location: string;
  timezone: string;
  email: string;
  phone: string | null;
  availability: string;
  availableForWork: boolean;
  resumeUrl: string | null;
  avatarUrl: string | null;
  githubUsername: string | null;
  socials: LinkItem[];
  stats: Metric[];
  education: { degree: string; school: string; location?: string; year: string }[];
  certifications: { name: string; issuer?: string; date: string; url?: string }[];
  accent: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  alternateNames: string[];
  ogImage: string | null;
  twitterHandle: string | null;
  googleVerification: string | null;
  bingVerification: string | null;
  updatedAt: string;
};

/** Optional per-page search and social overrides set in the admin. */
export type Seo = {
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogImage: string | null;
};

export type ProjectStatus = "production" | "open-source" | "in-progress" | "archived" | "concept";

export type ProjectCard = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  client: string | null;
  year: string;
  category: string;
  status: ProjectStatus;
  stack: string[];
  metrics: Metric[];
  coverImage: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  accent: string | null;
  featured: boolean;
  updatedAt: string;
};

export type Project = ProjectCard & Seo & {
  content: string;
  gallery: string[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export type Experience = {
  id: number;
  company: string;
  role: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  highlights: string[];
  stack: string[];
  url: string | null;
};

export type Service = { id: number; title: string; summary: string; points: string[] };
export type SkillGroup = { category: string; items: { name: string; level: number }[] };

export type PostCard = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number;
};
export type Post = PostCard & Seo & { content: string };

export type Site = {
  profile: Profile;
  services: Service[];
  projects: ProjectCard[];
  experience: Experience[];
  skills: SkillGroup[];
  posts: PostCard[];
};

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; weekday: number };
export type ContributionCalendar = { key: string; label: string; total: number; weeks: ContributionDay[][] };

export type GithubActivity = {
  username: string;
  profileUrl: string;
  avatarUrl: string | null;
  name: string | null;
  publicRepos: number;
  followers: number;
  totalStars: number;
  languages: { name: string; share: number }[];
  topRepos: { name: string; description: string | null; url: string; stars: number; language: string | null; pushedAt: string }[];
  /** Rolling last year ("last") first, then calendar years, newest first. Empty without a token. */
  calendars: ContributionCalendar[];
  fetchedAt: string;
};
