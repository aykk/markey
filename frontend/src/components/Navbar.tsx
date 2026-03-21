"use client";

import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Context", scrollTop: true },
  { href: "#what-is-markey", label: "Markey", scrollTop: false },
  { href: "#how-it-works", label: "How it Works", scrollTop: false },
] as const;

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-6 md:px-10 py-5 relative">
      <div className="hidden md:flex items-center gap-8 md:gap-12">
        {NAV_LINKS.map(({ href, label, scrollTop }) => (
          <Link
            key={label}
            href={href}
            onClick={scrollTop ? (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } : undefined}
            className="font-mono text-xs tracking-[0.2em] text-charcoal/70 hover:text-charcoal uppercase transition-colors"
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
