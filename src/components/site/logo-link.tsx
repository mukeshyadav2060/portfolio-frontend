"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/scroll";

/**
 * The header logo. From another page it is a normal link home; on the home page itself it
 * scrolls smoothly back to the top and drops any #section hash from the address.
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
        // Same scroller as scrollToHash(), aimed at 0 so the header's scroll padding can't stop it short.
        const instant = prefersReducedMotion();
        if (window.__lenis) window.__lenis.scrollTo(0, { immediate: instant, duration: 1.1 });
        else scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
        if (location.hash) history.pushState(history.state, "", "/");
      }}
    >
      {children}
    </Link>
  );
}
