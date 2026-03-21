"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExplodeScrollIndicator } from "@/components/ExplodeScrollIndicator";
import { HeroCanvas } from "@/components/three/HeroCanvas";

const WHEEL_DELTA_PER_FULL = 800;

function scrollToContent() {
  window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
}

export function HeroSection() {
  const [explodeProgress, setExplodeProgress] = useState(1);
  const accumulatedRef = useRef(WHEEL_DELTA_PER_FULL);

  const onWheel = useCallback((e: WheelEvent) => {
    if (window.scrollY > 50) return;

    const isFullyUnexploded = accumulatedRef.current === 0;
    if (isFullyUnexploded && e.deltaY > 0) return;

    e.preventDefault();
    accumulatedRef.current = Math.max(
      0,
      Math.min(WHEEL_DELTA_PER_FULL, accumulatedRef.current - e.deltaY)
    );
    setExplodeProgress(accumulatedRef.current / WHEEL_DELTA_PER_FULL);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  return (
    <section className="relative h-dvh w-full min-h-[320px] overflow-hidden bg-off-white">
      <div className="absolute inset-0">
        <HeroCanvas exploded={explodeProgress} />
      </div>

      <ExplodeScrollIndicator
        explodeProgress={explodeProgress}
        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 md:right-8"
      />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center -translate-y-6">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <h1 className="font-mono text-3xl md:text-4xl tracking-[0.25em] text-charcoal uppercase">
            Markey
          </h1>
          <p className="font-sans text-base md:text-lg text-charcoal/90 max-w-md leading-relaxed">
            Security and compliance inside your slicer. Stop blind translation.
          </p>
          <div className="flex gap-3 pointer-events-auto">
            <a
              href="#what-is-markey"
              className="rounded-md px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-charcoal border border-charcoal/40 hover:border-charcoal/70 transition-colors"
            >
              Learn more
            </a>
            <Link
              href="/demo"
              className="rounded-md px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase text-off-white bg-charcoal hover:bg-charcoal/90 transition-colors"
            >
              Try demo
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-6 md:px-12 pt-20 -translate-y-6">
        <div className="hidden md:block w-48 lg:w-56 text-left">
          <p className="font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase leading-relaxed">
            Ghost guns are unserialized and untraceable—often made via 3D printing.
          </p>
        </div>
        <div className="hidden md:block w-48 lg:w-56 text-right">
          <p className="font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase leading-relaxed">
            State laws in 2026 criminalize 3D printing of firearm parts. Slicers have no way to comply.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute top-24 left-0 right-0 z-10 px-6 md:hidden">
        <p className="font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase text-center max-w-[280px] mx-auto leading-relaxed">
          Ghost guns are untraceable. 2026 laws restrict 3D-printed parts. Slicers can&apos;t detect them.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-2 pb-8 md:pb-10 translate-y-6">
        <p className="font-mono text-[10px] md:text-xs tracking-[0.28em] text-charcoal/70 uppercase text-center max-w-[90vw]">
          Scroll to unexplode · Drag to rotate · Auto-spin
        </p>
        <button
          onClick={scrollToContent}
          onKeyDown={(e) => e.key === "Enter" && scrollToContent()}
          className="pointer-events-auto p-2 text-charcoal/70 hover:text-charcoal transition-colors"
          aria-label="Scroll to content"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
