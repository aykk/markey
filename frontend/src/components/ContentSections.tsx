"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

// ── Viewport fade-in ─────────────────────────────────────────────────────────
function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      {children}
    </div>
  );
}

// ── Shared design tokens ─────────────────────────────────────────────────────
const labelClass =
  "font-mono text-xs md:text-sm tracking-[0.28em] md:tracking-[0.32em] text-charcoal/60 uppercase font-semibold";
const sectionRule = "border-0 border-t border-charcoal/25 my-0";
const blockHeadingClass =
  "font-mono text-sm md:text-base tracking-[0.16em] md:tracking-[0.2em] text-charcoal font-semibold uppercase mb-0";
const problemHeadingClass =
  "font-mono text-sm md:text-base tracking-[0.18em] md:tracking-[0.22em] text-white font-semibold uppercase mb-0";
const bodyClass =
  "font-sans text-[13px] md:text-sm text-charcoal/80 leading-[1.65]";
const bodyLead =
  "font-sans text-sm md:text-[15px] text-charcoal/90 leading-snug font-medium";
const bodyStrong = "font-semibold text-charcoal";
const darkLabel =
  "font-mono text-xs md:text-sm tracking-[0.28em] text-white/45 uppercase font-semibold";
const darkRule = "border-0 border-t border-white/15 my-0";

export function ContentSections() {
  return (
    <div className="bg-off-white">
      {/* ── Context + The problem ────────────────────────────────────────── */}
      <section
        id="what-is-markey"
        className="flex w-full min-h-0 flex-col border-t border-charcoal/40"
      >
        {/* Context panel */}
        <div className="w-full px-8 py-16 md:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-7xl">
            <FadeIn>
              <div className="mb-10 md:mb-12">
                <p className={labelClass}>Context</p>
                <hr className={`${sectionRule} mt-3 max-w-16`} aria-hidden />
              </div>
            </FadeIn>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-0">
              {/* Left: key terms + three narrative cells */}
              <div className="flex min-w-0 flex-1 flex-col lg:pr-10 xl:pr-12">
                <FadeIn delay={100}>
                  <div className="border border-charcoal/40 bg-off-white p-6 md:p-8">
                    <div className="pb-1">
                      <h3 className={blockHeadingClass}>Key terms</h3>
                      <hr className={`${sectionRule} mt-3`} />
                    </div>
                    <ul className="mt-6 space-y-0 divide-y divide-charcoal/15">
                      <li className={`${bodyClass} py-4 first:pt-0`}>
                        <span className="font-mono text-xs md:text-sm tracking-[0.14em] md:tracking-[0.18em] text-charcoal font-bold uppercase block mb-2">
                          Slicer
                        </span>
                        <span className="block text-[13px] md:text-sm text-charcoal/75 leading-relaxed">
                          Software that converts 3D models into print instructions;
                          the bridge between{" "}
                          <strong className={bodyStrong}>design and manufacture.</strong>
                        </span>
                      </li>
                      <li className={`${bodyClass} py-4`}>
                        <span className="font-mono text-xs md:text-sm tracking-[0.14em] md:tracking-[0.18em] text-charcoal font-bold uppercase block mb-2">
                          G-code
                        </span>
                        <span className="block text-[13px] md:text-sm text-charcoal/75 leading-relaxed">
                          The machine instruction language that tells 3D printers
                          exactly where to move and{" "}
                          <strong className={bodyStrong}>how much material to extrude.</strong>
                        </span>
                      </li>
                      <li className={`${bodyClass} py-4 last:pb-0`}>
                        <span className="font-mono text-xs md:text-sm tracking-[0.14em] md:tracking-[0.18em] text-charcoal font-bold uppercase block mb-2">
                          Mesh
                        </span>
                        <span className="block text-[13px] md:text-sm text-charcoal/75 leading-relaxed">
                          A 3D model made of vertices and triangles; the input format
                          slicers consume before producing{" "}
                          <strong className={bodyStrong}>G-code.</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                </FadeIn>

                <FadeIn delay={200}>
                  <div className="mt-10 grid gap-0 border border-charcoal/40 md:grid-cols-3">
                    <div className="border-b border-charcoal/40 p-6 md:border-b-0 md:border-r md:p-8">
                      <div className="pb-1">
                        <h3 className={blockHeadingClass}>The blind spot</h3>
                        <hr className={`${sectionRule} mt-3`} />
                      </div>
                      <p className={`${bodyClass} mt-5`}>
                        <span className={bodyLead}>
                          Slicers translate meshes to G-code with{" "}
                          <em className="font-semibold not-italic text-charcoal">
                            zero understanding
                          </em>{" "}
                          of what they&apos;re printing.
                        </span>{" "}
                        <span className="text-charcoal/75">
                          No detection. No compliance. Just{" "}
                          <strong className={bodyStrong}>blind translation</strong>
                          —and in 2026, that&apos;s a liability.
                        </span>
                      </p>
                    </div>
                    <div className="border-b border-charcoal/40 p-6 md:border-b-0 md:border-r md:p-8">
                      <div className="pb-1">
                        <h3 className={blockHeadingClass}>Ghost guns</h3>
                        <hr className={`${sectionRule} mt-3`} />
                      </div>
                      <p className={`${bodyClass} mt-5`}>
                        <span className={bodyLead}>
                          Unserialized, untraceable firearms
                        </span>
                        <span className="text-charcoal/75">
                          , increasingly made via 3D printing. They bypass
                          background checks.{" "}
                          <strong className={bodyStrong}>
                            Slicers cannot tell a toy from a receiver.
                          </strong>
                        </span>
                      </p>
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="pb-1">
                        <h3 className={blockHeadingClass}>2026 regulations</h3>
                        <hr className={`${sectionRule} mt-3`} />
                      </div>
                      <p className={`${bodyClass} mt-5`}>
                        <span className="text-[13px] md:text-sm text-charcoal/80 leading-relaxed">
                          Colorado criminalizes 3D printing firearms and parts.
                          California requires printers to block gun files by 2029.
                          New York has proposed similar mandates.
                        </span>
                        <span className="mt-3 block border-t border-charcoal/15 pt-3 text-[13px] md:text-sm leading-relaxed text-charcoal/75">
                          Fines up to{" "}
                          <strong className={bodyStrong}>$25,000 per violation.</strong>{" "}
                          None of that works unless enforcement lives{" "}
                          <strong className={bodyStrong}>inside the slicer</strong>,
                          where meshes become G-code.
                        </span>
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </div>

              {/* Right: The problem */}
              <FadeIn
                delay={150}
                className="flex w-full shrink-0 flex-col border-t border-charcoal/40 pt-10 lg:w-[min(100%,380px)] lg:border-l lg:border-t-0 lg:border-charcoal/40 lg:pl-10 lg:pt-0 xl:w-[400px] xl:pl-12"
              >
                <div className="flex min-h-0 flex-1 flex-col border border-charcoal bg-black px-6 py-8 md:px-8 md:py-10 lg:min-h-full">
                  <div className="pb-1">
                    <h3 className={problemHeadingClass}>The problem</h3>
                    <hr className={`${darkRule} mt-3`} />
                  </div>
                  <ul className="mt-6 space-y-0 divide-y divide-white/10 font-sans text-[13px] md:text-sm text-off-white/85 leading-relaxed">
                    <li className="flex gap-3 py-4 first:pt-0">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-white/60" aria-hidden />
                      <span>
                        <strong className="font-semibold text-white">Analysis gap.</strong>{" "}
                        Slicers need object files and G-code reviewed so outputs
                        don&apos;t resemble gun parts.
                      </span>
                    </li>
                    <li className="flex gap-3 py-4">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-white/60" aria-hidden />
                      <span>
                        <strong className="font-semibold text-white">No guardrails.</strong>{" "}
                        Anyone—including hobbyists—can print a gun.
                      </span>
                    </li>
                    <li className="flex gap-3 py-4">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-white/60" aria-hidden />
                      <span>
                        <strong className="font-semibold text-white">Disguised parts.</strong>{" "}
                        Ghost guns and parts can look like normal industrial brackets.
                      </span>
                    </li>
                    <li className="flex gap-3 py-4">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-white/60" aria-hidden />
                      <span>
                        <strong className="font-semibold text-white">No G-code enforcement.</strong>{" "}
                        There are no working implementations that restrict G-code to
                        prevent malicious use.
                      </span>
                    </li>
                    <li className="flex gap-3 py-4 last:pb-0">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-white/60" aria-hidden />
                      <span>
                        <strong className="font-semibold text-white">Policy goal.</strong>{" "}
                        Defer and discourage printing firearms.
                      </span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>

        {/* ── The solution — full-width dark panel ─────────────────────────── */}
        <div className="w-full border-t border-charcoal/40 bg-black px-8 py-20 md:px-10 md:py-28 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-5xl">
            <FadeIn>
              <p className={darkLabel}>The solution</p>
              <h2 className="font--(family-name:--font-ibm-plex-mono) mt-6 text-5xl md:text-7xl tracking-tight text-white leading-none">
                Markey<span className="text-white/30">*</span>
              </h2>
              <hr className={`${darkRule} mt-8 mb-8`} />
              <p className="font-mono text-sm md:text-base tracking-[0.12em] text-white/65 uppercase leading-relaxed max-w-lg">
                An ML-powered identification and restriction layer within your
                slicer.
              </p>
            </FadeIn>
            <FadeIn delay={160}>
              <p className="mt-14 font-sans text-sm text-white/35 leading-relaxed border-t border-white/10 pt-6 max-w-2xl">
                <span className="font-mono text-white/55">*</span>{" "}
                Markey is named after Senator Ed Markey, who has championed
                legislation to ban 3D-printed guns for over a decade.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-charcoal/40 px-8 py-20 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto w-full max-w-4xl">

          {/* Section label */}
          <FadeIn>
            <div className="mb-16">
              <p className="font-mono text-xs md:text-sm tracking-[0.35em] text-charcoal/60 uppercase font-semibold">
                How it works
              </p>
              <hr className={`${sectionRule} mt-3 max-w-12`} />
            </div>
          </FadeIn>

          {/* 3 numbered steps — dark cards */}
          <FadeIn>
            <div className="grid md:grid-cols-3 border border-charcoal">
              {(
                [
                  {
                    num: "01",
                    heading: "Toolpath generation",
                    body: "The slicer converts a CAD file or mesh into raw G-code. Markey ingests standard mesh formats (STL, OBJ, GLB) at the compliance layer for vision analysis before export.",
                  },
                  {
                    num: "02",
                    heading: "Spatial mapping",
                    body: "An OpenGL visualizer intercepts the G-code and renders the physical toolpaths, giving the software eyes to understand the geometry being printed.",
                  },
                  {
                    num: "03",
                    heading: "Heuristic auditing",
                    body: "Vision models and LLMs analyze renderings and spatial signals to flag restricted geometries. Policy enforcement halts extrusion export and surfaces a clear verdict.",
                  },
                ] as { num: string; heading: string; body: string }[]
              ).map(({ num, heading, body }, i) => (
                <div
                  key={num}
                  className={`bg-black p-6 md:p-8 flex flex-col${
                    i < 2
                      ? " border-b border-charcoal md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <span className="font-mono text-3xl md:text-4xl font-bold text-white/10 mb-6 block leading-none">
                    {num}
                  </span>
                  <h3 className="font-mono text-sm md:text-base tracking-[0.18em] text-white font-semibold uppercase mb-3">
                    {heading}
                  </h3>
                  <hr className={`${darkRule} mb-4`} />
                  <p className="font-sans text-[13px] md:text-sm text-white/60 leading-relaxed flex-1">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Why G-code — dark callout */}
          <FadeIn className="mt-14">
            <div className="bg-black border border-charcoal p-6 md:p-8">
              <p className={`${darkLabel} mb-1`}>Why G-code</p>
              <hr className={`${darkRule} mt-3 mb-5`} />
              <p className="font-sans text-sm md:text-base text-white/75 leading-relaxed max-w-2xl">
                Markey analyzes{" "}
                <strong className="font-semibold text-white">G-code directly</strong>{" "}
                instead of visualizations. This prevents workarounds—such as
                enclosing restricted parts in a box to conceal the interior—since
                the{" "}
                <strong className="font-semibold text-white">
                  toolpaths themselves
                </strong>{" "}
                are audited.
              </p>
            </div>
          </FadeIn>

          {/* Between the slicer and the printer */}
          <FadeIn className="mt-16 border-t border-charcoal/30 pt-14">
            <p className={`${labelClass} mb-1`}>Between the slicer and the printer</p>
            <hr className={`${sectionRule} mt-3 mb-7 max-w-12`} />
            <p className="font-sans text-sm md:text-base text-charcoal/85 leading-relaxed max-w-3xl">
              We&apos;ve built Markey to sit in the handoff from{" "}
              <strong className="font-semibold text-charcoal">
                design to manufacture
              </strong>
              : when a 3D model becomes print-ready instructions, when you export
              from slicing software, or when a job is sent to a connected printer.
              It reviews what the part looks like, checks the actual print
              instructions, and can{" "}
              <strong className="font-semibold text-charcoal">
                stop a job before those instructions reach the hardware
              </strong>
              . Teams keep using their existing slicers and workflows; Markey is
              the checkpoint in the middle.
            </p>
          </FadeIn>

          {/* Other places it can plug in */}
          <FadeIn className="mt-10">
            <p className="font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase font-semibold mb-5">
              Other places it can plug in
            </p>
            <div className="grid md:grid-cols-3 border border-charcoal/40">
              {(
                [
                  {
                    heading: "Raspberry Pi / Klipper",
                    body: "Markey can live on the same machine that already runs the printer—reviewing or holding the print file before it is passed to the hardware.",
                  },
                  {
                    heading: "Wi-Fi & cloud queues",
                    body: "Vet jobs while they're still digital, before motors turn. Compute stays on a normal server, not the minimal chip inside the printer.",
                  },
                  {
                    heading: "Resin, SLA & industrial",
                    body: "Connect Markey where the print file already flows, and keep demanding image and policy work off hardware whose job is to move resin or axes on schedule.",
                  },
                ] as { heading: string; body: string }[]
              ).map(({ heading, body }, i) => (
                <div
                  key={heading}
                  className={`p-6 md:p-7 flex flex-col${
                    i < 2
                      ? " border-b border-charcoal/40 md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <h4 className="font-mono text-xs md:text-sm tracking-[0.15em] text-charcoal font-semibold uppercase mb-1">
                    {heading}
                  </h4>
                  <hr className={`${sectionRule} mt-3 mb-4`} />
                  <p className="font-sans text-[13px] md:text-sm text-charcoal/70 leading-relaxed flex-1">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Features — two dark cards */}
          <FadeIn className="mt-16 border-t border-charcoal/30 pt-14">
            <p className={`${labelClass} mb-1`}>Features</p>
            <hr className={`${sectionRule} mt-3 mb-8 max-w-12`} />
            <div className="grid md:grid-cols-2 border border-charcoal">
              <div className="bg-black p-6 md:p-8 border-b border-charcoal md:border-b-0 md:border-r">
                <h4 className="font-mono text-xs md:text-sm tracking-[0.18em] text-white font-semibold uppercase mb-1">
                  Classification &amp; vision
                </h4>
                <hr className={`${darkRule} mt-3 mb-5`} />
                <ul className="space-y-3 font-sans text-[13px] md:text-sm text-white/60 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Label, confidence, natural-language summary, and model reasoning
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Six orthographic renders (front, back, left, right, top, bottom)
                  </li>
                </ul>
              </div>
              <div className="bg-black p-6 md:p-8">
                <h4 className="font-mono text-xs md:text-sm tracking-[0.18em] text-white font-semibold uppercase mb-1">
                  Analyst dashboard
                </h4>
                <hr className={`${darkRule} mt-3 mb-5`} />
                <ul className="space-y-3 font-sans text-[13px] md:text-sm text-white/60 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Policy verdict with analyst narrative and export-gate status
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Risk index and classifier confidence bars
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Alternate-hypothesis probabilities (horizontal bar chart)
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[6px] h-1 w-1 shrink-0 bg-white/35" aria-hidden />
                    Per-view salience chart and instrumented pipeline trace
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>

          {/* Market */}
          <FadeIn className="mt-16 border-t border-charcoal/30 pt-14">
            <p className={`${labelClass} mb-1`}>Market</p>
            <hr className={`${sectionRule} mt-3 mb-8 max-w-12`} />
            <div className="grid md:grid-cols-2 gap-5">
              <div className="border border-charcoal/40 p-6 md:p-7">
                <h4 className="font-mono text-xs md:text-sm tracking-[0.15em] text-charcoal font-semibold uppercase mb-1">
                  2026 hardware mandates
                </h4>
                <hr className={`${sectionRule} mt-3 mb-4`} />
                <p className="font-sans text-[13px] md:text-sm text-charcoal/75 leading-relaxed">
                  New York Governor Kathy Hochul and Manhattan DA Alvin Bragg are
                  pushing 2026 mandates requiring 3D printers to include built-in
                  software to block ghost gun production. The National Safety
                  Council reports that{" "}
                  <strong className={bodyStrong}>
                    hard engineering controls reduce accidents by over 70%
                  </strong>{" "}
                  compared to administrative rules. Markey provides that control.
                </p>
              </div>
              <div className="border border-charcoal/40 p-6 md:p-7">
                <h4 className="font-mono text-xs md:text-sm tracking-[0.15em] text-charcoal font-semibold uppercase mb-1">
                  Intellectual property
                </h4>
                <hr className={`${sectionRule} mt-3 mb-4`} />
                <p className="font-sans text-[13px] md:text-sm text-charcoal/75 leading-relaxed">
                  The National Association of Manufacturers notes that IP theft
                  costs the industrial sector{" "}
                  <strong className={bodyStrong}>hundreds of billions annually</strong>.
                  The toolpath restriction protocol can serve aerospace and
                  automotive companies to prevent unauthorized printing of
                  proprietary assets.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Demo CTA — full dark panel */}
          <FadeIn className="mt-20">
            <div id="demo" className="bg-black border border-charcoal px-8 py-12 md:px-10 md:py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className={`${darkLabel} mb-4`}>Try it yourself</p>
                <h3 className="font--(family-name:--font-ibm-plex-mono) text-2xl md:text-3xl text-white tracking-tight leading-snug">
                  Upload a mesh.<br />Get a verdict.
                </h3>
              </div>
              <div className="flex flex-col gap-2.5 items-start md:items-end shrink-0">
                <Link
                  href="/demo"
                  className="inline-block font-mono text-xs tracking-[0.2em] uppercase text-black bg-white hover:bg-white/85 px-8 py-3.5 transition-colors"
                >
                  Try demo
                </Link>
                <p className="font-mono text-[10px] tracking-[0.15em] text-white/30 uppercase">
                  Accepts .stl, .obj, and .glb files
                </p>
              </div>
            </div>
          </FadeIn>

        </div>
      </section>
    </div>
  );
}
