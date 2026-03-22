"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  PauseIcon,
  PlayIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons/ViewControlIcons";
import { HeroCanvas } from "@/components/three/HeroCanvas";

const WHEEL_DELTA_PER_FULL = 800;
const LOCK_DURATION = 500;

export function ContextSection() {
  const [explodeProgress, setExplodeProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const accumulatedRef = useRef(0);
  const lockedUntilRef = useRef(0);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  const zoomIn = useCallback(() => {
    const c = orbitControlsRef.current;
    if (!c) return;
    c.dollyIn(0.92);
    c.update();
  }, []);

  const zoomOut = useCallback(() => {
    const c = orbitControlsRef.current;
    if (!c) return;
    c.dollyOut(0.92);
    c.update();
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    if (window.scrollY > 0) return;

    if (Date.now() < lockedUntilRef.current) {
      e.preventDefault();
      return;
    }

    const isFullyCollapsed = accumulatedRef.current === 0;
    const isFullyExploded = accumulatedRef.current === WHEEL_DELTA_PER_FULL;

    // Collapsed + scroll up: nothing to do; let browser handle
    if (isFullyCollapsed && e.deltaY < 0) return;
    // Exploded + scroll down: advance the page
    if (isFullyExploded && e.deltaY > 0) return;

    e.preventDefault();

    const prev = accumulatedRef.current;
    // Scroll down → explode; scroll up → collapse
    accumulatedRef.current = Math.max(
      0,
      Math.min(WHEEL_DELTA_PER_FULL, accumulatedRef.current + e.deltaY)
    );
    setExplodeProgress(accumulatedRef.current / WHEEL_DELTA_PER_FULL);

    if (prev < WHEEL_DELTA_PER_FULL && accumulatedRef.current === WHEEL_DELTA_PER_FULL) {
      lockedUntilRef.current = Date.now() + LOCK_DURATION;
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  return (
    <section className="flex min-h-[calc(100dvh-52px)] w-full flex-col md:flex-row bg-off-white">
      <div className="flex w-full md:w-[45%] shrink-0 flex-col justify-center px-8 md:px-10 lg:px-12 py-12 md:py-16">
        <h1 className="flex flex-col gap-1 font-[family-name:var(--font-ibm-plex-mono)] text-[clamp(28px,8px+2.5vw,52px)] tracking-tight text-charcoal leading-[1.2]">
          <span>3D printed firearms</span>
          <span>
            are a{" "}
            <strong className="font-bold">
              <span className="rounded-sm bg-charcoal/[0.09] -mx-0.5 px-2.5 pt-px pb-0.5 md:px-3 md:pt-px md:pb-1">
                growing problem
              </span>
            </strong>
            .
          </span>
        </h1>
        <p className="mt-8 font-mono text-charcoal/85 text-sm tracking-[0.15em] uppercase leading-relaxed">
          In 2026, laws have been passed in Colorado, California, and New York to restrict this, but <strong className="font-semibold text-charcoal">little to no software exists</strong> to enforce it.
        </p>

        <ul className="mt-10 list-disc list-outside space-y-4 pl-5 marker:text-charcoal/40">
          <li className="font-sans text-sm text-charcoal/65 leading-relaxed pl-1">
            Ghost guns are <strong className="font-medium text-charcoal/90">unserialized and untraceable,</strong> often made via 3D printing.
          </li>
          <li className="font-sans text-sm text-charcoal/65 leading-relaxed pl-1">
            As of now, 3D printers have no guardrails. <strong className="font-medium text-charcoal/90">Virtually no software can detect or block prohibited blueprints.</strong>
          </li>
        </ul>

        <div className="mt-12 flex flex-wrap items-start gap-3">
          <a
            href="#what-is-markey"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("what-is-markey")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex h-[42px] items-center justify-center px-6 font-mono text-xs tracking-[0.2em] uppercase text-charcoal border border-charcoal/40 bg-off-white transition-colors duration-300 ease-out hover:bg-black hover:border-black hover:text-off-white"
          >
            Learn more
          </a>
          <div className="flex w-fit flex-col items-center gap-1.5">
            <Link
              href="/demo"
              className="inline-flex h-[42px] items-center justify-center px-6 font-mono text-xs tracking-[0.2em] uppercase text-off-white bg-black transition-colors duration-300 ease-out hover:bg-black/80"
            >
              Try Demo
            </Link>
            <p className="w-full text-center font-mono text-[10px] tracking-[0.18em] uppercase text-charcoal/80">
              .stl, .obj, .glb
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[320px] md:min-h-0 border-t md:border-t-0 md:border-l border-charcoal/40 overflow-hidden bg-black">
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          aria-label={autoRotate ? "Pause rotation" : "Play rotation"}
          title={autoRotate ? "Pause rotation" : "Play rotation"}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center text-white border border-white/40 transition-colors duration-300 ease-out hover:bg-white/10 select-none"
        >
          {autoRotate ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="flex h-10 w-10 items-center justify-center text-white border border-white/40 transition-colors duration-300 ease-out hover:bg-white/10 select-none"
          >
            <ZoomInIcon />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="flex h-10 w-10 items-center justify-center text-white border border-white/40 transition-colors duration-300 ease-out hover:bg-white/10 select-none"
          >
            <ZoomOutIcon />
          </button>
        </div>
        <span className="absolute bottom-4 right-4 z-10 font-mono text-sm tracking-[0.3em] text-white uppercase select-none">
          Fig. 01
        </span>
        <div className="absolute inset-0">
          <HeroCanvas
            exploded={explodeProgress}
            controlsRef={orbitControlsRef}
            autoRotate={autoRotate}
          />
        </div>
      </div>
    </section>
  );
}
