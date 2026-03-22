"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center -translate-y-6">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <h1 className="font-mono text-3xl md:text-4xl tracking-[0.25em] text-charcoal uppercase">
            Markey
          </h1>
          <p className="font-sans text-base md:text-lg text-charcoal/90 max-w-md leading-relaxed">
            Mesh upload, fixed views, classifier, short dashboard, between slicer
            and printer before print instructions go out.
          </p>
          <div className="flex items-start justify-center gap-3 pointer-events-auto">
            <a
              href="#what-is-markey"
              className="inline-flex h-10 items-center justify-center rounded-md border border-charcoal/40 bg-off-white px-4 font-mono text-xs tracking-[0.2em] uppercase text-charcoal transition-colors duration-300 ease-out hover:border-black hover:bg-black hover:text-off-white"
            >
              Learn more
            </a>
            <a
              href="https://huggingface.co/jungter/markey-v1/tree/main"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 font-mono text-xs tracking-[0.2em] uppercase text-off-white transition-colors duration-300 ease-out hover:bg-black/80"
            >
              The Model
            </a>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-6 md:px-12 pt-20 -translate-y-6">
        <div className="hidden md:block w-48 lg:w-56 text-left">
          <p className="font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase leading-relaxed">
            Ghost guns are unserialized and untraceable, often made via 3D printing.
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
        <p className="font-mono text-xs tracking-[0.35em] text-charcoal/70 uppercase">
          Scroll to unexplode
        </p>
        <button
          onClick={scrollToContent}
          onKeyDown={(e) => e.key === "Enter" && scrollToContent()}
          className="pointer-events-auto p-2 text-charcoal/70 transition-colors duration-300 ease-out hover:text-charcoal"
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
