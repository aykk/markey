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
              You upload a mesh (STL, OBJ, or GLB). Fixed views, classifier, then
              a short dashboard. Meant to sit between the slicer and the printer
              so a job can be reviewed or stopped before print instructions go
              out.
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
            <div className="mb-8 max-w-3xl space-y-4 text-charcoal/85 leading-relaxed text-sm">
              <p>
                Markey is a fine-tuned model built on{" "}
                <strong className="font-medium text-charcoal">
                  Qwen3 0.6B
                </strong>{" "}
                embeddings. It was trained with a hybrid approach:{" "}
                <strong className="font-medium text-charcoal">
                  29-dimensional G-code feature extraction
                </strong>{" "}
                and a projection layer on text embeddings. In this setup,
                feature extraction does most of the heavy lifting, while the
                text pathway serves as a supplementary classifier.
              </p>
              <p>
                G-code is like assembly: it is human-readable, but not in a form
                that makes it easy to reason about what the printed part will
                look like. That plays to the tokenizer&apos;s strengths, tokens
                like{" "}
                <code className="font-mono text-[0.92em] text-charcoal">
                  G0
                </code>{" "}
                already land as natural string units, so we get reasonable
                results from Qwen&apos;s tokenizer without building a custom one
                from scratch.
              </p>
            </div>
            <div className="space-y-8">
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  01
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Mesh in
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  STL, OBJ, GLB. Runs on the file; slicer UI unchanged.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  02
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Views + model
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  Fixed views of the part, then the classifier.
                </p>
              </div>
              <div>
                <span className="font-mono text-xs tracking-widest text-charcoal/50">
                  03
                </span>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mt-1 mb-2">
                  Dashboard
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  Label, confidence, alternates, which views mattered, review or
                  stop before print instructions if you wire it in there.
                </p>
              </div>
            </div>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              G-code
            </h2>
            <p className="text-charcoal/85 leading-relaxed">
              Mesh checks miss cases where geometry is hidden in a shell but
              shows up in toolpaths. This prototype is mesh + handoff before
              print; G-code is a separate thread.
            </p>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Between the slicer and the printer
            </h2>
            <p className="text-charcoal/85 leading-relaxed text-sm mb-6">
              Between slicing and the printer: part file exists, motors
              haven&apos;t started. The file and hardware handoff are what matter
              here.
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
              Demo UI
            </h2>
            <p className="text-charcoal/85 leading-relaxed mb-3 text-sm">
              Classification output:
            </p>
            <ul className="space-y-2 text-charcoal/85 leading-relaxed text-sm mb-6">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Label, confidence, summary, model reasoning
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Six orthographic renders (front, back, left, right, top,
                bottom)
              </li>
            </ul>
            <p className="text-charcoal/85 leading-relaxed mb-3 text-sm">
              Dashboard:
            </p>
            <ul className="space-y-2 text-charcoal/85 leading-relaxed text-sm">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Verdict, short narrative, demo gate status
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Risk index and confidence bars
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Alternate labels (bar chart) and view weights
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Orthographic grid with per-view emphasis
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Pipeline steps with timings and short notes
              </li>
            </ul>
          </section>

          <section className={SECTION_SPACING}>
            <h2 className="font-mono text-xs tracking-[0.3em] text-charcoal/60 uppercase mb-6">
              Background
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
                  rules; that&apos;s the regulatory angle; this repo is a small
                  mesh-classification experiment, not a product.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  Intellectual property
                </h3>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  The National Association of Manufacturers notes that IP theft
                  costs the industrial sector hundreds of billions annually, a
                  related accountability problem, not the focus of this project.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8">
            <Link
              href="/demo"
              className="inline-flex h-[42px] items-center justify-center rounded-sm border-2 border-charcoal/40 px-6 font-mono text-sm tracking-[0.2em] uppercase text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal/5"
            >
              Try Demo
            </Link>
            <p className="mt-2.5 font-mono text-[10px] tracking-[0.18em] uppercase text-charcoal/80">
              .stl, .obj, .glb
            </p>
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
