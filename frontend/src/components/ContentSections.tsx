import Link from "next/link";
import { SectionChevron } from "@/components/SectionChevron";

export function ContentSections() {
  return (
    <div className="bg-off-white">
      <section id="what-is-markey" className="flex min-h-dvh flex-col px-8 md:px-16 py-24 md:py-32">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mx-auto max-w-2xl w-full">
          <p className="font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase mb-6">
            The solution
          </p>
          <h2 className="font-mono text-3xl md:text-4xl tracking-[0.25em] text-charcoal uppercase mb-6">
            Markey
          </h2>
          <p className="font-mono text-lg md:text-xl tracking-widest text-charcoal/90 mb-14 leading-relaxed">
            Security and compliance inside your slicer. Stop blind translation.
          </p>

          <div className="space-y-12">
            <div className="pl-5 border-l-2 border-charcoal/20">
              <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-3">The blind spot</h3>
              <p className="text-charcoal/85 leading-relaxed">
                Slicers translate meshes to G-code with zero understanding of what they&apos;re printing. No detection. No compliance. Just blind translation—and in 2026, that&apos;s a liability.
              </p>
            </div>
            <div className="pl-5 border-l-2 border-charcoal/20">
              <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-3">Ghost guns</h3>
              <p className="text-charcoal/85 leading-relaxed">
                Unserialized, untraceable firearms—increasingly made via 3D printing. They bypass background checks. Slicers cannot tell a toy from a receiver.
              </p>
            </div>
            <div className="pl-5 border-l-2 border-charcoal/20">
              <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-3">2026 regulations</h3>
              <p className="text-charcoal/85 leading-relaxed">
                Colorado criminalizes 3D printing firearms and parts. California requires printers to block gun files by 2029. New York has proposed similar mandates. Fines up to $25,000 per violation. Compliance must happen inside the toolchain—that&apos;s Markey.
              </p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">The Problem</h3>
            <ul className="space-y-6 text-charcoal/85 leading-relaxed">
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                Slicers need analysis of object files and G-code to ensure they don&apos;t resemble gun parts.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                There are no guardrails—anyone, including hobbyists, can print a gun.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                Ghost guns and ghost gun parts are designed to look like normal parts, such as industrial brackets.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                There are no working implementations that restrict G-code to prevent malicious use.
              </li>
              <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.5em] before:w-1 before:h-1 before:rounded-full before:bg-charcoal/40">
                The goal is to defer and discourage people from printing guns.
              </li>
            </ul>
          </div>
          </div>
        </div>
        <SectionChevron targetId="how-it-works" ariaLabel="Scroll to How it works" />
      </section>

      <section
        id="how-it-works"
        className="flex min-h-dvh flex-col justify-center px-8 md:px-16 py-24 md:py-32 border-t border-charcoal/10"
      >
        <div className="mx-auto max-w-4xl w-full">
          <p className="font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase mb-16">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">01</span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Toolpath generation
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                The slicer converts a CAD file or mesh into raw G-code.
              </p>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">02</span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Spatial mapping
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                An OpenGL visualizer intercepts the G-code and renders the physical toolpaths—giving the software eyes to understand the geometry being printed.
              </p>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm tracking-widest text-charcoal/50 mb-4">03</span>
              <h3 className="font-mono text-base tracking-[0.2em] text-charcoal uppercase mb-4">
                Heuristic auditing
              </h3>
              <p className="text-charcoal/80 leading-relaxed text-sm flex-1">
                An LLM analyzes the visual and spatial data to identify restricted geometries. If a prohibited component is detected, the system triggers a failsafe and halts the extrusion export.
              </p>
            </div>
          </div>
          <p className="mt-14 text-charcoal/75 leading-relaxed italic">
            Like the elevator safety brake invented in 1852: the system defaults to safety during failure. Markey fails closed when it detects illicit instructions.
          </p>

          <div className="mt-20">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">Why G-code</h3>
            <p className="text-charcoal/85 leading-relaxed">
              Markey analyzes G-code directly instead of visualizations. This prevents workarounds—such as enclosing restricted parts in a box to conceal the interior—since the toolpaths themselves are audited.
            </p>
          </div>

          <div className="mt-16">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">Features</h3>
            <p className="text-charcoal/85 leading-relaxed mb-6">
              Data visualizations include:
            </p>
            <ul className="space-y-4 text-charcoal/85 leading-relaxed">
              <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-charcoal/50">
                Confidence values
              </li>
              <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-charcoal/50">
                Part it recognizes the object as
              </li>
              <li className="pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-charcoal/50">
                Other parts it may recognize the object as
              </li>
            </ul>
          </div>

          <div className="mt-16">
            <h3 className="font-mono text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-6">Market</h3>
            <div className="space-y-8">
              <div>
                <h4 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  2026 hardware mandates
                </h4>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  New York Governor Kathy Hochul and Manhattan DA Alvin Bragg are pushing 2026 mandates requiring 3D printers to include built-in software to block ghost gun production. The National Safety Council reports that hard engineering controls reduce machinery accidents by over 70% compared to administrative rules. Markey provides that hard engineering control.
                </p>
              </div>
              <div>
                <h4 className="font-mono text-sm tracking-[0.15em] text-charcoal uppercase mb-2">
                  Intellectual property
                </h4>
                <p className="text-charcoal/85 leading-relaxed text-sm">
                  The National Association of Manufacturers notes that IP theft costs the industrial sector hundreds of billions annually. The toolpath restriction protocol can serve aerospace and automotive companies to prevent unauthorized printing of proprietary assets.
                </p>
              </div>
            </div>
          </div>

          <div id="demo" className="mt-20">
            <Link
              href="/demo"
              className="inline-block font-mono text-sm tracking-[0.2em] uppercase text-charcoal border-2 border-charcoal/40 hover:border-charcoal hover:bg-charcoal/5 px-6 py-3 rounded-sm transition-colors"
            >
              Try demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
