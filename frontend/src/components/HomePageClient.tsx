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
                  The slicer converts a CAD file or mesh into raw G-code. Markey
                  ingests standard mesh formats (STL, OBJ, GLB) at the compliance
                  layer for vision analysis before export.
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
                  Vision models and LLMs analyze renderings and spatial signals to
                  flag restricted geometries. When a prohibited component is
                  detected, policy enforcement halts extrusion export and surfaces
                  a clear verdict at the export gate.
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
              Between the slicer and the printer
            </h2>
            <p className="text-charcoal/85 leading-relaxed text-sm mb-6">
              Markey sits where a 3D model becomes print instructions and those
              instructions are sent to the machine. It reviews the part and the
              real print file, and can block the job before hardware runs. Teams
              keep their slicers; Markey is the checkpoint in the middle.
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-charcoal/55 uppercase mb-4">
              Other places it can plug in
            </p>
            <ul className="space-y-4 text-charcoal/85 leading-relaxed text-sm">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                <span className="font-mono text-xs uppercase tracking-wide text-charcoal">
                  Pi / Klipper style
                </span>
                ,{" "}
                Same small computer that already runs the printer can vet or
                hold files before they reach the printer&apos;s internal board.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                <span className="font-mono text-xs uppercase tracking-wide text-charcoal">
                  Cloud &amp; networked jobs
                </span>
                ,{" "}
                Check jobs on a server or office PC while they are still in the
                queue, before the printer starts.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                <span className="font-mono text-xs uppercase tracking-wide text-charcoal">
                  Resin &amp; industrial
                </span>
                ,{" "}
                Attach where the print file already goes through plant or desktop
                software; keep heavy analysis off the machine&apos;s minimal
                control hardware.
              </li>
            </ul>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Features
            </h2>
            <p className="text-charcoal/85 leading-relaxed mb-3 text-sm">
              Classification &amp; vision:
            </p>
            <ul className="space-y-2 text-charcoal/85 leading-relaxed text-sm mb-6">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Label, confidence, summary, and model reasoning
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Six orthographic renders (front, back, left, right, top,
                bottom)
              </li>
            </ul>
            <p className="text-charcoal/85 leading-relaxed mb-3 text-sm">
              Analyst dashboard:
            </p>
            <ul className="space-y-2 text-charcoal/85 leading-relaxed text-sm">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Policy verdict, analyst narrative, export-gate status
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Risk index and confidence bars
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Alternate hypotheses and view-salience charts (Recharts)
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Salience-weighted orthographic grid
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Instrumented pipeline trace and analyst insight bullets
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
