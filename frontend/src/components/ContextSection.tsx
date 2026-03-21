"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeroCanvas } from "@/components/three/HeroCanvas";

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
    <section className="flex min-h-[calc(100dvh-52px)] w-full flex-col md:flex-row bg-off-white">
      <div className="flex w-full md:w-[45%] shrink-0 flex-col justify-center px-8 md:px-10 lg:px-12 py-12 md:py-16">
        <h1 className="font-mono text-2xl md:text-3xl lg:text-4xl tracking-[0.12em] text-charcoal uppercase leading-[1.3]">
          3D printed firearms are a growing problem.
        </h1>
        <p className="mt-8 text-charcoal/85 text-base md:text-lg leading-relaxed max-w-lg">
          In 2026, laws have been passed in Colorado, California, and New York to restrict this, but little to no software exists to enforce it.
        </p>

        <ul className="mt-10 space-y-5">
          <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/70 font-mono text-xs tracking-[0.18em] text-charcoal/80 uppercase leading-relaxed">
            Ghost guns are unserialized and untraceable, often made via 3D printing.
          </li>
          <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/70 font-mono text-xs tracking-[0.18em] text-charcoal/80 uppercase leading-relaxed">
            No software can detect or block prohibited files. 3D printers have no guardrails.
          </li>
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href="#what-is-markey"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("what-is-markey")?.scrollIntoView({ behavior: "smooth" });
            }}
className="font-mono text-xs tracking-[0.2em] uppercase text-charcoal border border-charcoal/40 hover:bg-charcoal hover:text-off-white px-6 py-3 transition-colors"
            >
              Learn more
          </a>
          <Link
            href="/demo"
            className="font-mono text-xs tracking-[0.2em] uppercase text-off-white bg-black hover:bg-black/80 px-6 py-3 transition-colors"
          >
            Try demo
          </Link>
        </div>
      </div>

      <div className="relative flex-1 min-h-[320px] md:min-h-0 border-t md:border-t-0 md:border-l border-charcoal/40 overflow-hidden bg-black">
        <span className="absolute bottom-3 right-3 z-10 font-mono text-[10px] tracking-[0.3em] text-white uppercase select-none">
          Fig. 01
        </span>
        <div className="absolute inset-0">
          <HeroCanvas exploded={explodeProgress} />
        </div>
      </div>
    </section>
  );
}
