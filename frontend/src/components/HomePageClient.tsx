"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GunPanel } from "@/components/GunPanel";

const SECTION_SPACING = "mb-20 md:mb-28";
const WHEEL_DELTA_PER_FULL = 600;

export function HomePageClient() {
  const [exploded, setExploded] = useState(1);
  const accumulatedRef = useRef(WHEEL_DELTA_PER_FULL);
  const gunPanelRef = useRef<HTMLDivElement>(null);

  const onWheel = useCallback((e: WheelEvent) => {
    const gunPanel = gunPanelRef.current;
    if (!gunPanel) return;
    const rect = gunPanel.getBoundingClientRect();
    const isOverGun =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!isOverGun) return;

    e.preventDefault();
    accumulatedRef.current = Math.max(
      0,
      Math.min(WHEEL_DELTA_PER_FULL, accumulatedRef.current - e.deltaY)
    );
    setExploded(accumulatedRef.current / WHEEL_DELTA_PER_FULL);
  }, []);

  useEffect(() => {
    document.documentElement.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.documentElement.removeEventListener("wheel", onWheel);
    };
  }, [onWheel]);

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 min-h-dvh h-dvh overflow-hidden bg-off-white">
      {/* Left: text content */}
      <div className="order-2 md:order-1 overflow-y-auto border-b md:border-b-0 md:border-r-2 border-charcoal/50 scrollbar-none">
        <article className="px-6 py-16 md:px-12 md:py-24 max-w-xl mx-auto md:mx-0 md:max-w-none">
          <header className="mb-16 md:mb-20">
            <h1 className="font-mono text-3xl md:text-4xl tracking-[0.2em] text-charcoal uppercase mb-6">
              Markey
            </h1>
            <p className="text-charcoal/90 leading-relaxed text-lg">
              A security and compliance layer inside your slicer. Stops blind
              translation of meshes into machine instructions.
            </p>
          </header>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              The Problem
            </h2>
            <ul className="space-y-4 text-charcoal/85 leading-relaxed">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                Slicers need analysis of object files and G-code to ensure they
                don&apos;t resemble gun parts.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                There are no guardrails, anyone, including hobbyists, can print a
                gun.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                Ghost guns and ghost gun parts are designed to look like normal
                parts, such as industrial brackets.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                There are no working implementations that restrict G-code to
                prevent malicious use.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                The goal is to defer and discourage people from printing guns.
              </li>
            </ul>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              How it works
            </h2>
            <div className="space-y-8">
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  01
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Toolpath generation
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  The slicer converts a CAD file or mesh into raw G-code.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  02
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Spatial mapping
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  An OpenGL visualizer intercepts the G-code and renders the
                  physical toolpaths, giving the software eyes to understand the
                  geometry being printed.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  03
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Heuristic auditing
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  An LLM analyzes the visual and spatial data to identify
                  restricted geometries. If a prohibited component is detected,
                  the system triggers a failsafe and halts the extrusion export.
                </p>
              </div>
            </div>
            <p className="mt-8 text-charcoal/75 leading-relaxed text-sm italic">
              Like the elevator safety brake invented in 1852: the system
              defaults to safety during failure. Markey fails closed when it
              detects illicit instructions.
            </p>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Why G-code
            </h2>
            <p className="text-charcoal/85 leading-relaxed">
              Markey analyzes G-code directly instead of visualizations. This
              prevents workarounds, such as enclosing restricted parts in a box
              to conceal the interior, since the toolpaths themselves are
              audited.
            </p>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Features
            </h2>
            <p className="text-charcoal/85 leading-relaxed mb-4">
              Data visualizations include:
            </p>
            <ul className="space-y-2 text-charcoal/85 leading-relaxed text-sm">
              <li className="pl-5 relative before:content-[', '] before:absolute before:left-0 before:text-charcoal/50">
                Confidence values
              </li>
              <li className="pl-5 relative before:content-[', '] before:absolute before:left-0 before:text-charcoal/50">
                Part it recognizes the object as
              </li>
              <li className="pl-5 relative before:content-[', '] before:absolute before:left-0 before:text-charcoal/50">
                Other parts it may recognize the object as
              </li>
            </ul>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Market
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  2026 hardware mandates
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  New York Governor Kathy Hochul and Manhattan DA Alvin Bragg are
                  pushing 2026 mandates requiring 3D printers to include
                  built-in software to block ghost gun production. The National
                  Safety Council reports that hard engineering controls reduce
                  machinery accidents by over 70% compared to administrative
                  rules. Markey provides that hard engineering control.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  Intellectual property
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  The National Association of Manufacturers notes that IP theft
                  costs the industrial sector hundreds of billions annually. The
                  toolpath restriction protocol can serve aerospace and
                  automotive companies to prevent unauthorized printing of
                  proprietary assets.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8">
            <Link
              href="/demo"
              className="inline-block font-mono text-sm tracking-[0.2em] uppercase text-charcoal border-2 border-charcoal/40 hover:border-charcoal hover:bg-charcoal/5 px-6 py-3 rounded-sm transition-colors"
            >
              Try demo
            </Link>
          </div>
        </article>
      </div>

      <div
        ref={gunPanelRef}
        className="order-1 md:order-2 self-start relative flex flex-col w-full h-dvh min-h-[50vh] md:min-h-dvh"
      >
        <GunPanel exploded={exploded} />
      </div>
    </main>
  );
}
