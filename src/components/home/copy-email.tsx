"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <a href={`mailto:${email}`} className="link-draw break-all text-[clamp(1.25rem,2vw,1.6rem)] font-medium">
        {email}
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(email).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="rounded-full bg-bg-3 px-3 py-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:text-ink"
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
