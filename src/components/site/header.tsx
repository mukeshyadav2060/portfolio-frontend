import Link from "next/link";
import type { Profile } from "@/lib/types";
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
        <LogoLink className="relative z-10 flex items-center">
          <span className="whitespace-nowrap font-display text-[17px] font-semibold tracking-[-0.02em]">
            <span className="sr-only">Home: </span>
            {profile.name}
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
