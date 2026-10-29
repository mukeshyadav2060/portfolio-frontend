"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scrollToHash } from "@/lib/scroll";

export type Command = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  href?: string;
  external?: boolean;
  copy?: string;
};

const OPEN_EVENT = "palette:open";

/** ⌘K / Ctrl+K menu: jump to any section, project or post, copy the email, open socials. */
export function CommandPalette({ commands }: { commands: Command[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<Element | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands
      .map((c) => {
        const hay = `${c.label} ${c.group} ${c.hint ?? ""}`.toLowerCase();
        const pos = hay.indexOf(q);
        // Fallback fuzzy: every character in order.
        let fuzzy = 0;
        for (const ch of hay) if (ch === q[fuzzy]) fuzzy++;
        return { c, score: pos >= 0 ? 100 - pos : fuzzy === q.length ? 10 : -1 };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.c);
  }, [commands, query]);

  const show = useCallback(() => {
    restoreFocus.current = document.activeElement;
    setOpen(true);
    setQuery("");
    setIndex(0);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    (restoreFocus.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) hide();
        else show();
      }
    };
    addEventListener("keydown", onKey);
    addEventListener(OPEN_EVENT, show);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener(OPEN_EVENT, show);
    };
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const run = async (c: Command) => {
    if (c.copy) {
      await navigator.clipboard.writeText(c.copy).catch(() => {});
      setToast("Copied to clipboard");
      setTimeout(() => setToast(null), 1800);
      hide();
      return;
    }
    hide();
    if (!c.href) return;
    if (c.external) window.open(c.href, "_blank", "noopener,noreferrer");
    else if (c.href.startsWith("/#") && location.pathname === "/" && scrollToHash(c.href.slice(1))) {
      if (location.hash !== c.href.slice(1)) history.pushState(history.state, "", c.href.slice(1));
    } else router.push(c.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") hide();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[index]) {
      e.preventDefault();
      void run(results[index]);
    } else if (e.key === "Tab") e.preventDefault();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-90 flex items-start justify-center px-4 pt-[14vh]" onKeyDown={onKeyDown}>
          <div className="palette-backdrop absolute inset-0 bg-bg/75" onClick={hide} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="palette-panel relative w-full max-w-xl overflow-hidden rounded-2xl bg-bg-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
          >
            <input
              ref={input}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIndex(0);
              }}
              placeholder="Search sections, projects, posts…"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
              className="w-full bg-transparent px-5 py-4 text-base text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <ul id="palette-list" role="listbox" className="max-h-[55vh] overflow-y-auto overscroll-contain bg-bg-3/40 p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">No matches.</li>}
              {results.map((c, i) => {
                const header = i === 0 || results[i - 1].group !== c.group ? c.group : null;
                return (
                  <li key={c.id} role="presentation">
                    {header && <div className="px-3 pb-1 pt-3 text-[0.8125rem] text-ink-3">{header}</div>}
                    <div
                      id={`cmd-${c.id}`}
                      role="option"
                      aria-selected={i === index}
                      onPointerMove={() => setIndex(i)}
                      onClick={() => run(c)}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm text-ink-2 aria-selected:bg-bg-3 aria-selected:text-ink"
                    >
                      <span className="truncate">{c.label}</span>
                      <span className="shrink-0 text-[0.8125rem] text-ink-3">{c.hint ?? (c.external ? "↗" : c.copy ? "Copy" : "↵")}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-4 px-5 py-3 text-[0.8125rem] text-ink-3">
              <span>↑↓ to move</span>
              <span>↵ to open</span>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-95 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-bg transition-all duration-500 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        {toast}
      </div>
    </>
  );
}
