"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExplodeScrollIndicator } from "@/components/ExplodeScrollIndicator";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { SectionChevron } from "@/components/SectionChevron";

const WHEEL_DELTA_PER_FULL = 800;

export function ContextSection() {
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
    <section className="relative flex min-h-dvh w-full flex-col md:flex-row bg-off-white overflow-visible">
      {/* Left: header content — clean typographic hierarchy */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 md:px-16 lg:px-24 py-24 md:py-32 min-h-0">
        <div className="max-w-lg">
          <h1 className="font-mono text-2xl md:text-3xl lg:text-4xl tracking-[0.12em] text-charcoal uppercase leading-[1.3]">
            3D printed firearms are a growing problem.
          </h1>
          <p className="mt-8 text-charcoal/85 text-base md:text-lg leading-loose">
            In 2026, laws have been passed in Colorado, California, and New York to restrict this, but little to no software exists to enforce it.
          </p>

          <ul className="mt-10 space-y-6">
            <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-charcoal/60 font-mono text-xs tracking-[0.18em] text-charcoal/80 uppercase leading-relaxed">
              Ghost guns are unserialized and untraceable, often made via 3D printing.
            </li>
            <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-charcoal/60 font-mono text-xs tracking-[0.18em] text-charcoal/80 uppercase leading-relaxed">
              No software can detect or block prohibited files. 3D printers have no guardrails.
            </li>
          </ul>

          <a
            href="#what-is-markey"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("what-is-markey")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-12 inline-block font-mono text-xs tracking-[0.2em] uppercase text-charcoal border border-charcoal/30 hover:border-charcoal/60 hover:bg-charcoal/5 px-6 py-3 rounded transition-colors"
          >
            The solution →
          </a>
        </div>

        <div className="mt-14 md:mt-20 [&_button]:pointer-events-auto">
          <SectionChevron targetId="what-is-markey" ariaLabel="Scroll to Markey" />
        </div>
      </div>

      {/* Right: model — refined positioning */}
      <div className="absolute inset-0 md:left-[45%] z-20 min-h-[280px] md:min-h-0 overflow-visible">
        <HeroCanvas exploded={explodeProgress} />
      </div>

      {/* Wheel “unexplode” progress — matches scroll budget before page scroll */}
      <ExplodeScrollIndicator
        explodeProgress={explodeProgress}
        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 md:right-8"
      />

      {/* Grid eases in toward the next section — left column only (avoids gun canvas), shifted down */}
      <div
        className="pointer-events-none absolute left-0 right-0 -bottom-14 z-8 h-32 sm:h-40 md:-bottom-20 md:right-[55%] md:h-48 bg-content-grid-fade-in"
        aria-hidden
      />
    </section>
  );
}
