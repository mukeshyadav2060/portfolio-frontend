import "server-only";
import { cacheLife } from "next/cache";
import { Marked, type Token, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

const LANGS = ["ts", "tsx", "js", "jsx", "json", "bash", "css", "html", "sql", "diff", "yaml", "md"] as const;
let highlighter: Promise<Highlighter> | null = null;
const getHighlighter = () =>
  (highlighter ??= createHighlighter({ themes: ["github-dark-default"], langs: [...LANGS] }));

const marked = new Marked({ gfm: true });
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
    },
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      // The page title is the only h1, so a Markdown "# Heading" becomes an h2.
      const level = Math.max(depth, 2);
      return `<h${level} id="${id}">${text}</h${level}>`;
    },
  },
});

/**
 * Markdown → HTML on the server (zero client JS). Code fences are highlighted by Shiki.
 * Cached by source text, which also keeps Shiki's internal clock reads out of prerendering.
 */
export async function renderMarkdown(source: string): Promise<string> {
  "use cache";
  cacheLife("max");
  const tokens = marked.lexer(source);
  const code = tokens.filter((t): t is Tokens.Code => t.type === "code");
  if (code.length) {
    const hl = await getHighlighter();
    const loaded = new Set(hl.getLoadedLanguages());
    for (const t of code) {
      const lang = loaded.has(t.lang ?? "") ? t.lang! : "text";
      const html = hl.codeToHtml(t.text, { lang, theme: "github-dark-default" });
      Object.assign(t, { type: "html", text: html, pre: true, block: true } satisfies Partial<Token>);
    }
  }
  return marked.parser(tokens);
}
