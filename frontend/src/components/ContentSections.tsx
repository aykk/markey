import Link from "next/link";

const labelClass =
  "font-mono text-[10px] md:text-xs tracking-[0.28em] text-charcoal/55 uppercase";
const blockHeadingClass =
  "font-mono text-[10px] md:text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-3";
const bodyClass = "font-sans text-sm text-charcoal/75 leading-relaxed";
const bodyStrong = "font-medium text-charcoal";

export function ContentSections() {
  return (
    <div className="bg-off-white">
      {/* Context + problem (side by side) → solution */}
      <section
        id="what-is-markey"
        className="flex w-full min-h-0 flex-col border-t border-charcoal/40"
      >
        {/* Context + The problem (side by side on large screens) */}
        <div className="w-full px-8 py-16 md:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-7xl">
            <p className={`${labelClass} mb-10`}>Context</p>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-0">
              {/* Left: key terms + three narrative cells */}
              <div className="flex min-w-0 flex-1 flex-col lg:pr-10 xl:pr-12">
                <div className="border border-charcoal/40 bg-off-white p-6 md:p-8">
                  <h3 className={blockHeadingClass}>Key terms</h3>
                  <ul className="list-disc list-outside space-y-4 pl-5 marker:text-charcoal/35">
                    <li className={`${bodyClass} pl-1`}>
                      <span className="font-mono text-xs tracking-wide text-charcoal uppercase">
                        Slicer
                      </span>
                      , Software that converts 3D models into print instructions;
                      the bridge between design and manufacture.
                    </li>
                    <li className={`${bodyClass} pl-1`}>
                      <span className="font-mono text-xs tracking-wide text-charcoal uppercase">
                        G-code
                      </span>
                      , The machine instruction language that tells 3D printers
                      exactly where to move and how much material to extrude.
                    </li>
                    <li className={`${bodyClass} pl-1`}>
                      <span className="font-mono text-xs tracking-wide text-charcoal uppercase">
                        Mesh
                      </span>
                      , A 3D model made of vertices and triangles; the input format
                      slicers consume before producing G-code.
                    </li>
                  </ul>
                </div>

                <div className="mt-10 grid gap-0 border border-charcoal/40 md:grid-cols-3">
                  <div className="border-b border-charcoal/40 p-6 md:border-b-0 md:border-r md:p-8">
                    <h3 className={blockHeadingClass}>The blind spot</h3>
                    <p className={bodyClass}>
                      Slicers translate meshes to G-code with{" "}
                      <em className="italic text-charcoal/90">
                        zero understanding
                      </em>{" "}
                      of what they&apos;re printing. No detection. No compliance.
                      Just{" "}
                      <span className="underline decoration-charcoal/40 underline-offset-[3px]">
                        blind translation
                      </span>
                      , and in 2026, that&apos;s a liability.
                    </p>
                  </div>
                  <div className="border-b border-charcoal/40 p-6 md:border-b-0 md:border-r md:p-8">
                    <h3 className={blockHeadingClass}>Ghost guns</h3>
                    <p className={bodyClass}>
                      Unserialized, untraceable firearms, increasingly made via
                      3D printing. They bypass background checks. Slicers{" "}
                      <em className="italic text-charcoal/90">
                        cannot tell a toy from a receiver.
                      </em>
                    </p>
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className={blockHeadingClass}>2026 regulations</h3>
                    <p className={bodyClass}>
                      Colorado criminalizes 3D printing firearms and parts.
                      California requires printers to block gun files by 2029.
                      New York has proposed similar mandates. Fines up to{" "}
                      <strong className={bodyStrong}>
                        $25,000 per violation.
                      </strong>{" "}
                      None of that works unless enforcement lives{" "}
                      <strong className={bodyStrong}>inside the slicer</strong>,
                      where meshes become G-code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: The problem */}
              <aside className="flex w-full shrink-0 flex-col border-t border-charcoal/40 pt-10 lg:w-[min(100%,380px)] lg:border-l lg:border-t-0 lg:border-charcoal/40 lg:pl-10 lg:pt-0 xl:w-[400px] xl:pl-12">
                <div className="flex min-h-0 flex-1 flex-col border border-charcoal bg-black px-6 py-8 md:px-8 md:py-10 lg:min-h-full">
                  <h3 className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-white/50 uppercase mb-6">
                    The problem
                  </h3>
                  <ul className="space-y-5 font-sans text-sm text-off-white/80 leading-relaxed">
                    <li className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 bg-white/50"
                        aria-hidden
                      />
                      <span>
                        Slicers need analysis of object files and G-code to
                        ensure they don&apos;t resemble gun parts.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 bg-white/50"
                        aria-hidden
                      />
                      <span>
                        There are no guardrails, anyone, including hobbyists, can
                        print a gun.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 bg-white/50"
                        aria-hidden
                      />
                      <span>
                        Ghost guns and ghost gun parts are designed to look like
                        normal parts, such as industrial brackets.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 bg-white/50"
                        aria-hidden
                      />
                      <span>
                        There are no working implementations that restrict
                        G-code to prevent malicious use.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="mt-2 h-1 w-1 shrink-0 bg-white/50"
                        aria-hidden
                      />
                      <span>
                        The goal is to defer and discourage people from printing
                        guns.
                      </span>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* The solution */}
        <div className="w-full border-t border-charcoal/40 px-8 py-16 md:px-10 md:py-20 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-5xl">
            <p className={`${labelClass} mb-8`}>The solution</p>
            <h2 className="font-[family-name:var(--font-ibm-plex-mono)] text-3xl md:text-4xl tracking-tight text-charcoal leading-tight">
              Markey*
            </h2>
            <p className="mt-8 font-mono text-sm tracking-[0.12em] text-charcoal/80 uppercase leading-relaxed max-w-md">
              An ML-powered identification and restriction layer within your
              slicer.
            </p>

            <p className="mt-12 font-sans text-sm text-charcoal/65 leading-relaxed border-t border-charcoal/40 pt-8">
              <span className="font-mono text-charcoal/80">*</span>
              Markey is named after Senator Ed Markey, who has championed
              legislation to ban 3D-printed guns for over a decade.
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="flex min-h-dvh flex-col justify-center border-t border-charcoal/40 px-8 py-20 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase mb-16">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">
                01
              </span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Toolpath generation
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                The slicer converts a CAD file or mesh into raw G-code.
              </p>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">
                02
              </span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Spatial mapping
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                An OpenGL visualizer intercepts the G-code and renders the
                physical toolpaths, giving the software eyes to understand the
                geometry being printed.
              </p>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">
                03
              </span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Heuristic auditing
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                An LLM analyzes the visual and spatial data to identify
                restricted geometries. If a prohibited component is detected,
                the system triggers a failsafe and halts the extrusion export.
              </p>
            </div>
          </div>
          <div className="mt-20">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">
              Why G-code
            </h3>
            <p className="text-charcoal/85 leading-relaxed">
              Markey analyzes G-code directly instead of visualizations. This
              prevents workarounds, such as enclosing restricted parts in a box
              to conceal the interior, since the toolpaths themselves are
              audited.
            </p>
          </div>

          <div className="mt-16">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">
              Features
            </h3>
            <p className="text-charcoal/85 leading-relaxed mb-6">
              Data visualizations include:
            </p>
            <ul className="space-y-4 text-charcoal/85 leading-relaxed">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Confidence values
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Part it recognizes the object as
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1.5 before:h-1.5 before:bg-charcoal/40">
                Other parts it may recognize the object as
              </li>
            </ul>
          </div>

          <div className="mt-16">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">
              Market
            </h3>
            <div className="space-y-8">
              <div>
                <h4 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  2026 hardware mandates
                </h4>
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
                <h4 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  Intellectual property
                </h4>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  The National Association of Manufacturers notes that IP theft
                  costs the industrial sector hundreds of billions annually.
                  The toolpath restriction protocol can serve aerospace and
                  automotive companies to prevent unauthorized printing of
                  proprietary assets.
                </p>
              </div>
            </div>
          </div>

          <div id="demo" className="mt-20">
            <Link
              href="/demo"
              className="inline-block font-mono text-xs tracking-[0.2em] uppercase text-off-white bg-black hover:bg-black/80 px-6 py-3 transition-colors"
            >
              Try demo
            </Link>
            <p className="mt-3 font-mono text-[10px] tracking-[0.15em] text-charcoal/50 uppercase">
              Accepts .stl, .obj, and .glb files
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
