"use client";

import type { MouseEvent } from "react";
import Link from "next/link";

function handleNavClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
  scrollTop: boolean
) {
  if (scrollTop) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (href.startsWith("#")) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({
      behavior: "smooth",
    });
  }
}

const NAV_LINKS = [
  { href: "/", label: "Home", scrollTop: true },
  { href: "#what-is-markey", label: "Project", scrollTop: false },
  { href: "#how-it-works", label: "How it works", scrollTop: false },
  { href: "#results", label: "Results", scrollTop: false },
] as const;

export function Navbar() {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-center border-b border-charcoal/35 bg-off-white/90 px-6 py-5 shadow-[0_1px_0_0_rgba(54,69,79,0.06)] backdrop-blur-sm transition-[background-color,box-shadow,border-color] duration-500 ease-out md:px-10 supports-[backdrop-filter]:bg-off-white/80">
      <div className="hidden md:flex items-center gap-8 md:gap-12">
        {NAV_LINKS.map(({ href, label, scrollTop }) => (
          <Link
            key={label}
            href={href}
            onClick={(e) => handleNavClick(e, href, scrollTop)}
            className="font-mono text-xs tracking-[0.2em] uppercase text-charcoal/70 transition-colors duration-300 ease-out hover:text-charcoal"
          >
            {label}
          </Link>
        ))}
      </div>

      <button
        aria-label="Menu"
        className="absolute right-6 top-1/2 -translate-y-1/2 md:hidden flex flex-col gap-1.5"
      >
        <span className="block h-px w-5 bg-charcoal/70" />
        <span className="block h-px w-3 bg-charcoal/70" />
      </button>
    </nav>
  );
}
