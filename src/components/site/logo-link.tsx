"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header logo. From another page it is a normal link home; on the home page itself it
 * reloads the page from the top, so the hero plays again and any #section hash is dropped.
 */
export function LogoLink({ className, children }: { className: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (pathname !== "/" || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        // Jump first so the reload can't restore the old position.
        history.scrollRestoration = "manual";
        window.__lenis?.scrollTo(0, { immediate: true });
        scrollTo(0, 0);
        // A real reload, not router.push: the hero entrance and particles start over.
        location.assign(new URL("/", location.origin).href);
      }}
    >
      {children}
    </Link>
  );
}
