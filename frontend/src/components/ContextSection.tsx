"use client";

import { useCallback, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  PauseIcon,
  PlayIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons/ViewControlIcons";
import { HeroCanvas } from "@/components/three/HeroCanvas";

export function ContextSection() {
  const [hovered, setHovered] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
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

        <p className="mt-11 font-mono text-charcoal/85 text-sm tracking-[0.15em] uppercase leading-relaxed">
          In 2026, laws have been passed in Colorado, California, and New York to restrict this, but <strong className="font-semibold text-charcoal">little to no software exists</strong> to enforce it.
        </p>

        <ul className="mt-10 list-disc list-outside space-y-4 pl-5 marker:text-charcoal/40">
          <li className="font-sans text-sm text-charcoal/65 leading-relaxed pl-1">
            Since 2017, ghost gun recoveries have surged <strong className="font-medium text-charcoal/90">1,600%,</strong> with over 92,000 seized by law enforcement through 2023.
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
          <a
            href="https://huggingface.co/jungter/markey-v1/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[42px] items-center justify-center px-6 font-mono text-xs tracking-[0.2em] uppercase text-off-white bg-black transition-colors duration-300 ease-out hover:bg-black/80"
          >
            The Model
          </a>
        </div>
      </div>

      <div
        className="relative flex-1 min-h-[320px] md:min-h-0 border-t md:border-t-0 md:border-l border-charcoal/40 overflow-hidden bg-black"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
            exploded={hovered ? 1 : 0}
            controlsRef={orbitControlsRef}
            autoRotate={autoRotate}
          />
        </div>
      </div>
    </section>
  );
}
