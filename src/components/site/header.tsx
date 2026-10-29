import Link from "next/link";
import type { Profile } from "@/lib/types";
import { initialsOf } from "@/lib/format";
import { Magnetic } from "@/components/motion/magnetic";
import { LogoLink } from "./logo-link";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export const NAV = [
  { href: "/#work", label: "Work", id: "work" },
  { href: "/#about", label: "About", id: "about" },
  { href: "/#experience", label: "Experience", id: "experience" },
  { href: "/blog", label: "Writing", id: "writing" },
];

export type NavItem = (typeof NAV)[number];

export function Header({ profile, nav }: { profile: Profile; nav: NavItem[] }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="scroll-progress absolute inset-x-0 top-0 h-[2px] bg-accent" aria-hidden />
      <div className="frame flex h-[72px] items-center justify-between gap-6 bg-gradient-to-b from-bg/90 to-transparent">
        <LogoLink className="group relative z-10 flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-md bg-accent font-display text-[15px] font-bold tracking-[-0.04em] text-accent-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12 group-hover:scale-110"
          >
            {initialsOf(profile.name)}
          </span>
          <span className="whitespace-nowrap font-display text-[17px] font-semibold tracking-[-0.02em]">
            <span className="sr-only">Home: </span>
            <span className="max-sm:sr-only">{profile.name}</span>
          </span>
        </LogoLink>
        <NavLinks items={nav} />
        <div className="flex items-center gap-2.5">
          <MobileNav items={nav} />
          <Magnetic>
            <Link href="/#contact" className="btn btn-primary h-10 whitespace-nowrap px-5 text-sm">
              <span>Let’s talk</span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}
