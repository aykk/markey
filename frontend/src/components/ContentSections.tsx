import Image from "next/image";
import Link from "next/link";

const labelClass =
  "font-mono text-[10px] md:text-xs tracking-[0.28em] text-charcoal/55 uppercase";
/** Light gray band behind section eyebrows and key phrases */
const sectionHighlightClass =
  "rounded-sm bg-charcoal/[0.09] px-3 py-1 md:px-3.5 md:py-1 transition-colors duration-300 ease-out hover:bg-charcoal/15";
/** Cards / panels: smooth border, shadow, background */
const panelMotion =
  "transition-[border-color,box-shadow,background-color] duration-500 ease-out";
const blockHeadingClass =
  "font-mono text-[10px] md:text-xs tracking-[0.2em] text-charcoal/70 uppercase mb-3";
/** Step index + title for narrative cells */
const narrativeStepClass =
  "mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal";
const narrativeStepNumClass =
  "shrink-0 tabular-nums text-charcoal/40 tracking-[0.25em]";
const bodyClass = "font-sans text-sm text-charcoal/75 leading-relaxed";
const bodyStrong = "font-medium text-charcoal";

export function ContentSections() {
  return (
    <div className="bg-off-white pt-12 md:pt-16 lg:pt-20">
      {/* Context: narrative → constraints → vocabulary → project */}
      <section
        id="what-is-markey"
        className="flex w-full min-h-0 flex-col border-t border-charcoal/40"
      >
        <div className="w-full bg-charcoal/[0.025]">
          <div className="mx-auto w-full max-w-7xl px-8 pt-16 pb-10 md:px-10 md:pt-20 md:pb-12 lg:px-12 lg:pt-24 lg:pb-14 xl:px-16">
            <header className="mb-6 border-b border-charcoal/15 pb-6 md:mb-7 md:pb-7">
              <p className="mb-5 md:mb-6">
                <span className={`${labelClass} ${sectionHighlightClass}`}>
                  Context
                </span>
              </p>
              <p className="max-w-3xl font-sans text-sm leading-relaxed text-charcoal/80 md:text-[0.9375rem]">
                A ghost gun is an untraceable firearm, often 3D-printed at home,
                that requires no background check and carries no serial number.
                Over 92,000 have been seized since 2017, with 1,700 tied to
                homicides. The printer software that produces them has zero
                awareness of what it builds.
              </p>
            </header>

            {/* 1, Narrative arc */}
            <div
              className="mb-6 md:mb-7"
              aria-label="Context narrative: blind spot, misuse, regulation"
            >
              <p className="font-mono text-xs md:text-sm font-semibold tracking-[0.28em] text-charcoal uppercase mb-3">
                <span className="text-charcoal/45">1</span>, Relevant information
              </p>
              <div className="grid gap-0 border border-charcoal/40 bg-off-white md:grid-cols-3">
                <div
                  className={`border-b border-charcoal/40 bg-off-white px-5 py-5 md:border-b-0 md:border-r md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}
                >
                  <h3 className={narrativeStepClass}>
                    <span className={narrativeStepNumClass} aria-hidden>
                      01
                    </span>
                    <span>The blind spot</span>
                  </h3>
                  <p className={bodyClass}>
                    Meshes become G-code with{" "}
                    <em className="italic text-charcoal/90">
                      no semantic read
                    </em>{" "}
                    on the part, no built-in detection or compliance at the
                    boundary.{" "}
                    <span className="underline decoration-charcoal/40 underline-offset-[3px]">
                      Blind translation
                    </span>{" "}
                    is increasingly a legal and safety problem.
                  </p>
                </div>
                <div
                  className={`border-b border-charcoal/40 bg-off-white px-5 py-5 md:border-b-0 md:border-r md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}
                >
                  <h3 className={narrativeStepClass}>
                    <span className={narrativeStepNumClass} aria-hidden>
                      02
                    </span>
                    <span>Ghost guns</span>
                  </h3>
                  <p className={bodyClass}>
                    Unserialized parts and firearms from desktop printing bypass
                    ordinary checks. Today&apos;s slicers{" "}
                    <em className="italic text-charcoal/90">
                      cannot tell benign geometry from regulated hardware.
                    </em>
                  </p>
                </div>
                <div
                  className={`bg-off-white px-5 py-5 md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}
                >
                  <h3 className={narrativeStepClass}>
                    <span className={narrativeStepNumClass} aria-hidden>
                      03
                    </span>
                    <span>2026 regulations</span>
                  </h3>
                  <p className={bodyClass}>
                    States are moving: Colorado, California (printer blocks by
                    2029), New York-style proposals. Penalties reach{" "}
                    <strong className={bodyStrong}>
                      $25,000 per violation
                    </strong>
                    . Policy only bites if the check sits{" "}
                    <strong className={bodyStrong}>
                      where mesh becomes G-code
                    </strong>
                    , inside or against the slicer path.
                  </p>
                </div>
              </div>
            </div>

            {/* 2, Constraints this project responds to */}
            <div className="mb-6 border-t border-charcoal/20 pt-6 md:mb-7 md:pt-7">
              <p className="font-mono text-xs md:text-sm font-semibold tracking-[0.28em] text-charcoal uppercase mb-4">
                <span className="text-charcoal/45">2</span>, Where things stand
              </p>
              <ul className="max-w-3xl list-disc list-outside space-y-3 pl-5 marker:text-charcoal/40">
                <li className={`${bodyClass} pl-2`}>
                  Few real integrations stop malicious G-code at the source;
                  mesh-to-toolpath remains largely ungoverned.
                </li>
                <li className={`${bodyClass} pl-2`}>
                  This project aims to add friction: make unregistered firearm
                  prints harder, not invisible.
                </li>
              </ul>
            </div>

            <div className="border-t border-charcoal/20 pt-8 md:pt-9">
              <div
                className={`max-w-3xl border border-charcoal/40 bg-off-white px-5 py-6 md:px-6 md:py-8 ${panelMotion} hover:border-charcoal/50`}
              >
                <h3 className="font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal mb-5">Key terms</h3>
                <ul className="list-none space-y-5 pl-0">
                  <li className={`${bodyClass} pl-0`}>
                    <span className="block font-mono text-sm md:text-base font-bold tracking-wide text-charcoal uppercase mb-1">
                      Slicer
                    </span>
                    3D model to print instructions; the usual last software
                    stop before the machine.
                  </li>
                  <li className={`${bodyClass} pl-0`}>
                    <span className="block font-mono text-sm md:text-base font-bold tracking-wide text-charcoal uppercase mb-1">
                      G-code
                    </span>
                    Low-level moves and extrusion the printer executes.
                  </li>
                  <li className={`${bodyClass} pl-0`}>
                    <span className="block font-mono text-sm md:text-base font-bold tracking-wide text-charcoal uppercase mb-1">
                      Mesh
                    </span>
                    Triangle soup (STL/OBJ/GLB) the slicer ingests before
                    G-code.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Project summary, same surface as page, full viewport min height */}
        <div className="flex min-h-dvh w-full flex-col justify-center border-t border-charcoal/40 bg-off-white px-8 py-20 md:px-10 md:py-24 lg:px-12 lg:py-28 xl:px-16">
          <div className="mx-auto w-full max-w-6xl">
            <p className="mb-6 md:mb-8">
              <span
                className={`font-mono text-[10px] md:text-xs tracking-[0.35em] text-charcoal/50 uppercase ${sectionHighlightClass}`}
              >
                The project
              </span>
            </p>

            <div className="max-w-4xl">
              <h2 className="font-[family-name:var(--font-ibm-plex-mono)] text-[clamp(36px,12px+3vw,72px)] font-semibold tracking-tight text-charcoal leading-[1.05]">
                Markey
                <sup className="ml-0.5 align-super text-[0.35em] font-normal text-charcoal/45">
                  *
                </sup>
              </h2>
            </div>

            <div className="mt-10 md:mt-12 max-w-2xl space-y-5">
              <p className="font-sans text-lg md:text-xl font-medium leading-snug text-charcoal tracking-tight">
                The frontier firearm parts identification and restriction classifier for
                slicer softwares.
              </p>
              <p className="font-sans text-base md:text-lg text-charcoal/75 leading-relaxed">
                Markey classifies printable geometry at the mesh stage and
                surfaces a policy signal, confidence, alternates, and
                explainability, so high-risk jobs can be held or blocked before
                G-code is committed.
              </p>
            </div>

            <div className="mt-16 md:mt-20 grid gap-10 border-t border-charcoal/15 pt-14 md:grid-cols-3 md:gap-8 lg:gap-12">
              <div className="md:pr-4">
                <p className="font-mono text-xs tracking-[0.3em] text-charcoal/40 uppercase mb-3">
                  01
                </p>
                <h3 className="font-mono text-sm md:text-base tracking-[0.2em] text-charcoal uppercase mb-3">
                  Renders + classify
                </h3>
                <p className="font-sans text-sm text-charcoal/70 leading-relaxed">
                  Consistent renders from the mesh feed a single classification
                  pass, repeatable, auditable inputs.
                </p>
              </div>
              <div className="md:border-l md:border-charcoal/15 md:pl-8 lg:pl-10">
                <p className="font-mono text-xs tracking-[0.3em] text-charcoal/40 uppercase mb-3">
                  02
                </p>
                <h3 className="font-mono text-sm md:text-base tracking-[0.2em] text-charcoal uppercase mb-3">
                  Where it plugs in
                </h3>
                <p className="font-sans text-sm text-charcoal/70 leading-relaxed">
                  Hooks at export, queue, or pre-print, anywhere a mesh exists but
                  G-code is not yet final.
                </p>
              </div>
              <div className="md:border-l md:border-charcoal/15 md:pl-8 lg:pl-10">
                <p className="font-mono text-xs tracking-[0.3em] text-charcoal/40 uppercase mb-3">
                  03
                </p>
                <h3 className="font-mono text-sm md:text-base tracking-[0.2em] text-charcoal uppercase mb-3">
                  Dashboard
                </h3>
                <p className="font-sans text-sm text-charcoal/70 leading-relaxed">
                  Operators see verdict, uncertainty, and which evidence drove
                  it, enough to intervene without digging through logs.
                </p>
              </div>
            </div>

            <p className="mt-16 md:mt-20 max-w-2xl border-t border-charcoal/15 pt-10 font-sans text-sm leading-relaxed text-charcoal/55 transition-colors duration-500 ease-out hover:text-charcoal/70">
              <span className="font-mono text-charcoal/70">*</span>{" "}
              <span className="text-charcoal/60">
                Named for Senator Ed Markey, who has pushed legislation on
                3D-printed guns for years.
              </span>
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="flex min-h-dvh flex-col justify-center border-t border-charcoal/40 bg-off-white px-8 py-20 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-16">
            <span
              className={`font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase ${sectionHighlightClass}`}
            >
              How it works
            </span>
          </p>

          <div className="mb-10 md:mb-14 max-w-3xl space-y-4 text-charcoal/75 leading-relaxed text-sm md:text-base">
            <p>
              Markey is a fine-tuned model built on{" "}
              <strong className="font-medium text-charcoal/90">
                Qwen3 0.6B
              </strong>{" "}
              embeddings. It was trained with a hybrid approach:{" "}
              <strong className="font-medium text-charcoal/90">
                29-dimensional G-code feature extraction
              </strong>{" "}
              and a projection layer on text embeddings. In this setup,
              feature extraction does most of the heavy lifting, while the text
              pathway serves as a supplementary classifier.
            </p>
            <p>
              G-code is like assembly: it is human-readable, but not in a form
              that makes it easy to reason about what the printed part will
              look like. That plays to the tokenizer&apos;s strengths, tokens
              like{" "}
              <code className="font-mono text-[0.92em] text-charcoal/90">
                G0
              </code>{" "}
              already land as natural string units, so we get reasonable results
              from Qwen&apos;s tokenizer without building a custom one from
              scratch.
            </p>
          </div>

          {/* Pipeline steps */}
          <div className="grid gap-0 border border-charcoal/40 bg-off-white md:grid-cols-3">
            <div
              className={`border-b border-charcoal/40 px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
            >
              <span className="block font-mono text-sm tracking-widest text-charcoal/40 mb-2">
                01
              </span>
              <h3 className="font-mono text-sm md:text-base font-semibold tracking-[0.2em] text-charcoal uppercase mb-3">
                Mesh in
              </h3>
              <p className="text-charcoal/75 leading-relaxed text-sm">
                Standard formats: STL, OBJ, GLB. The slicer UI is unchanged;
                this runs on the file.
              </p>
            </div>
            <div
              className={`border-b border-charcoal/40 px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
            >
              <span className="block font-mono text-sm tracking-widest text-charcoal/40 mb-2">
                02
              </span>
              <h3 className="font-mono text-sm md:text-base font-semibold tracking-[0.2em] text-charcoal uppercase mb-3">
                Views + model
              </h3>
              <p className="text-charcoal/75 leading-relaxed text-sm">
                CuraEngine slices the files into G-Code, then passed to our model.
              </p>
            </div>
            <div
              className={`px-6 py-6 md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
            >
              <span className="block font-mono text-sm tracking-widest text-charcoal/40 mb-2">
                03
              </span>
              <h3 className="font-mono text-sm md:text-base font-semibold tracking-[0.2em] text-charcoal uppercase mb-3">
                Dashboard
              </h3>
              <p className="text-charcoal/75 leading-relaxed text-sm">
                Label, confidence, alternate guesses, and which views mattered.
                Review or stop before print instructions go out.
              </p>
            </div>
          </div>

          {/* G-code */}
          <div className="mt-16 border-t border-charcoal/20 pt-12">
            <h3 className="mb-4 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal">
              G-code
            </h3>
            <p className="max-w-3xl text-charcoal/75 leading-relaxed text-sm">
              Mesh-only checks don&apos;t catch everything, for example geometry
              hidden inside a shell can show up differently in toolpaths. This
              prototype is about the mesh and the handoff before print; G-code
              represents the paths the printer will actually execute.
            </p>
          </div>

          {/* Integration point */}
          <div className="mt-16 border-t border-charcoal/20 pt-12">
            <h3 className="mb-4 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal">
              Between the slicer and the printer
            </h3>
            <p className="max-w-3xl text-charcoal/75 leading-relaxed text-sm md:text-base">
              The aim is the gap between slicing and the printer: after you have
              a part file, before motors run. The interesting part is the file
              and when it meets hardware.
            </p>
          </div>

          {/* Integration targets */}
          <div className="mt-16 border-t border-charcoal/20 pt-12">
            <h3 className="mb-8 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal">
              Other places it can plug in
            </h3>
            <div className="grid gap-0 border border-charcoal/40 bg-off-white md:grid-cols-3">
              <div
                className={`border-b border-charcoal/40 px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
              >
                <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Raspberry Pi (Klipper)
                </h4>
                <p className="text-charcoal/75 leading-relaxed text-sm">
                  Many setups already use a small computer to run the printer. A
                  check could sit on that box before the file reaches the
                  printer board, last mile before print.
                </p>
              </div>
              <div
                className={`border-b border-charcoal/40 px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
              >
                <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Cloud + networked queues
                </h4>
                <p className="text-charcoal/75 leading-relaxed text-sm">
                  If jobs go through an app, server, or LAN before the printer,
                  the same idea applies: inspect while it&apos;s still digital.
                </p>
              </div>
              <div
                className={`px-6 py-6 md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
              >
                <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Resin, SLA + industrial
                </h4>
                <p className="text-charcoal/75 leading-relaxed text-sm">
                  Same pattern: attach where the file already flows; keep image
                  and policy work off the device that moves axes or resin.
                </p>
              </div>
            </div>
          </div>

          {/* Demo UI */}
          <div className="mt-16 border-t border-charcoal/20 pt-12">
            <h3 className="mb-8 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal">
              Demo UI
            </h3>
            <div className="grid gap-8 md:grid-cols-2">
              <div
                className={`border border-charcoal/40 bg-off-white px-6 py-6 md:px-7 md:py-8 ${panelMotion} hover:border-charcoal/50`}
              >
                <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Classification output
                </h4>
                <ul className="space-y-3 text-charcoal/75 leading-relaxed text-sm">
                  <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:bg-charcoal/35">
                    Label, confidence, short summary, model reasoning
                  </li>
                  <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:bg-charcoal/35">
                    Six orthographic renders (front, back, left, right, top,
                    bottom)
                  </li>
                </ul>
              </div>
              <div
                className={`border border-charcoal/40 bg-off-white px-6 py-6 md:px-7 md:py-8 ${panelMotion} hover:border-charcoal/50`}
              >
                <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Dashboard
                </h4>
                <ul className="space-y-3 text-charcoal/75 leading-relaxed text-sm">
                  <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:bg-charcoal/35">
                    Policy verdict (Restricted / Accepted / Review), narrative,
                    status line
                  </li>
                  <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:bg-charcoal/35">
                    Risk index and confidence bars
                  </li>
                  <li className="pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:bg-charcoal/35">
                    Alternate labels, per-view weights, pipeline timings
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Extra information */}
          <div className="mt-16 border-t border-charcoal/20 pt-12">
            <h3 className="mb-8 font-mono text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-charcoal">
              Extra information
            </h3>
            <div className="grid gap-0 border border-charcoal/40 bg-off-white md:grid-cols-2">
              <div
                className={`border-b border-charcoal/40 px-6 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
              >
                <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  2026 hardware mandates
                </h4>
                <p className="text-charcoal/75 leading-relaxed text-sm">
                  New York Governor Kathy Hochul and Manhattan DA Alvin Bragg are
                  pushing mandates requiring 3D printers to include built-in
                  software to block ghost gun production. Hard engineering
                  controls reduce machinery accidents by over 70%; this project
                  is one small slice (mesh classification), not a product claim.
                </p>
              </div>
              <div
                className={`px-6 py-6 md:px-7 md:py-8 ${panelMotion} hover:bg-charcoal/[0.03]`}
              >
                <h4 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Intellectual property
                </h4>
                <p className="text-charcoal/75 leading-relaxed text-sm">
                  IP theft costs the industrial sector hundreds of billions
                  annually. Same class of problem, accountability for what gets
                  printed, shows up outside guns; not the focus here.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            id="demo"
            className="mt-16 border-t border-charcoal/20 pt-12 transition-opacity duration-500"
          >
            <Link
              href="/demo"
              className="inline-flex h-[42px] items-center justify-center bg-black px-6 font-mono text-xs uppercase tracking-[0.2em] text-off-white transition-[color,background-color,transform,box-shadow] duration-300 ease-out hover:bg-black/80 hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] active:scale-[0.98]"
            >
              Try Demo
            </Link>
            <p className="mt-2.5 font-mono text-[10px] tracking-[0.18em] text-charcoal/80 uppercase">
              .stl, .obj, .glb
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section
        id="results"
        className="border-t border-charcoal/40 bg-off-white px-8 py-20 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto w-full max-w-4xl">
          {/* Header */}
          <p className="mb-6 md:mb-8">
            <span
              className={`font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase ${sectionHighlightClass}`}
            >
              Results
            </span>
          </p>

          <h2 className="font-[family-name:var(--font-ibm-plex-mono)] text-[clamp(28px,10px+2vw,48px)] font-semibold tracking-tight text-charcoal leading-[1.1] mb-4">
            Markey-v1 Evaluations
          </h2>
          <p className="max-w-3xl text-charcoal/75 leading-relaxed text-sm md:text-base mb-10">
            Markey is an 0.6B embedding model that was trained on a
            labeled dataset of gun and non-gun 3D-printable meshes in G-code. Its small footprint allows it to be ran on edge devices, while delivering frontier performance.
            <br />
            <br />
            You can find Markey <a href="https://huggingface.co/jungter/markey-v1" target="_blank" rel="noopener noreferrer" className="rounded-sm bg-charcoal/[0.09] px-1.5 py-0.5 text-charcoal transition-colors duration-300 ease-out hover:bg-charcoal/15">here</a>, and the dataset used to train Markey <a href="https://huggingface.co/datasets/jungter/gcode-to-model-gn" target="_blank" rel="noopener noreferrer" className="rounded-sm bg-charcoal/[0.09] px-1.5 py-0.5 text-charcoal transition-colors duration-300 ease-out hover:bg-charcoal/15">here</a>.
          </p>

          {/* Key metrics strip */}
          <div className="grid grid-cols-2 gap-0 border border-charcoal/40 bg-off-white md:grid-cols-4 mb-16">
            <div className={`border-b border-r border-charcoal/40 px-5 py-5 md:border-b-0 md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}>
              <p className="font-mono text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                99.3%
              </p>
              <p className="mt-1 font-mono text-[10px] md:text-xs tracking-[0.15em] text-charcoal/55 uppercase">
                Val accuracy
              </p>
            </div>
            <div className={`border-b border-charcoal/40 px-5 py-5 md:border-b-0 md:border-r md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}>
              <p className="font-mono text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                0
              </p>
              <p className="mt-1 font-mono text-[10px] md:text-xs tracking-[0.15em] text-charcoal/55 uppercase">
                False negatives
              </p>
            </div>
            <div className={`border-r border-charcoal/40 px-5 py-5 md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}>
              <p className="font-mono text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                400
              </p>
              <p className="mt-1 font-mono text-[10px] md:text-xs tracking-[0.15em] text-charcoal/55 uppercase">
                Test samples
              </p>
            </div>
            <div className={`px-5 py-5 md:px-6 md:py-6 ${panelMotion} hover:bg-charcoal/[0.03]`}>
              <p className="font-mono text-2xl md:text-3xl font-bold text-charcoal tracking-tight">
                ~8
              </p>
              <p className="mt-1 font-mono text-[10px] md:text-xs tracking-[0.15em] text-charcoal/55 uppercase">
                Epochs to converge
              </p>
            </div>
          </div>

          {/* Confusion matrix */}
          <div className="border-t border-charcoal/20 pt-12 mb-16">
            <div className="md:grid md:grid-cols-5 md:gap-10">
              <div className="md:col-span-2 mb-6 md:mb-0">
                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Confusion matrix
                </h3>
                <p className="text-charcoal/70 leading-relaxed text-sm mb-5">
                  Binary classification on the held-out test set. The model
                  never missed an actual firearm part, the failure mode that
                  matters most for a safety gate.
                </p>
                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between border-b border-charcoal/10 pb-2">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">True negatives</dt>
                    <dd className="font-mono text-sm font-semibold text-charcoal">176</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-charcoal/10 pb-2">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">True positives</dt>
                    <dd className="font-mono text-sm font-semibold text-charcoal">224</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-charcoal/10 pb-2">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">False positives</dt>
                    <dd className="font-mono text-sm font-semibold text-charcoal">3</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">False negatives</dt>
                    <dd className="font-mono text-sm font-bold text-charcoal">0</dd>
                  </div>
                </dl>
              </div>
              <div
                className={`md:col-span-3 border border-charcoal/40 bg-off-white ${panelMotion} hover:border-charcoal/50`}
              >
                <div className="p-4 md:p-6">
                  <Image
                    src="/VERT_confusion_matrix.webp"
                    alt="Confusion matrix showing 176 true negatives, 224 true positives, 3 false positives, 0 false negatives"
                    width={807}
                    height={678}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Training curves */}
          <div className="border-t border-charcoal/20 pt-12 mb-16">
            <div className="md:grid md:grid-cols-5 md:gap-10">
              <div className="md:col-span-2 mb-6 md:mb-0">
                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
                  Training curves
                </h3>
                <p className="text-charcoal/70 leading-relaxed text-sm mb-5">
                  Loss converges within the first few epochs with no divergence
                  between train and validation. Accuracy reaches 99.3% by
                  epoch 8 and holds flat. The model learns the boundary quickly
                  and does not overfit.
                </p>
                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between border-b border-charcoal/10 pb-2">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">Final train loss</dt>
                    <dd className="font-mono text-sm font-semibold text-charcoal">&lt; 0.01</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-charcoal/10 pb-2">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">Final val loss</dt>
                    <dd className="font-mono text-sm font-semibold text-charcoal">~0.05</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="font-mono text-xs tracking-wide text-charcoal/60 uppercase">Peak val accuracy</dt>
                    <dd className="font-mono text-sm font-bold text-charcoal">99.3%</dd>
                  </div>
                </dl>
              </div>
              <div
                className={`md:col-span-3 border border-charcoal/40 bg-off-white ${panelMotion} hover:border-charcoal/50`}
              >
                <div className="p-4 md:p-6">
                  <Image
                    src="/VERT_training_curves.webp"
                    alt="Training loss and validation accuracy curves over 20 epochs, converging early with 99.3% final accuracy"
                    width={1784}
                    height={581}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature distributions */}
          <div className="border-t border-charcoal/20 pt-12">
            <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-charcoal">
              Feature distributions
            </h3>
            <p className="max-w-2xl text-charcoal/70 leading-relaxed text-sm mb-8">
              Per-feature histograms split by class (gun vs. non-gun). Several
              G-code-derived features, particularly movement counts, coordinate
              ranges, and extrusion ratios, show clear separation between
              classes, confirming the classifier relies on structurally grounded
              signal rather than noise.
            </p>
            <div
              className={`border border-charcoal/40 bg-off-white ${panelMotion} hover:border-charcoal/50`}
            >
              <div className="p-4 md:p-6">
                <Image
                  src="/VERT_feature_distributions.webp"
                  alt="Grid of per-feature histograms comparing gun and non-gun class distributions across G-code features"
                  width={2994}
                  height={2384}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-t border-charcoal/40 bg-charcoal/[0.02] px-8 py-20 md:px-12 md:py-28 lg:px-16"
      >
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-6 md:mb-8">
            <span
              className={`font-mono text-xs tracking-[0.35em] text-charcoal/60 uppercase ${sectionHighlightClass}`}
            >
              FAQ
            </span>
          </p>

          <h2 className="font-[family-name:var(--font-ibm-plex-mono)] text-[clamp(24px,8px+2vw,40px)] font-semibold tracking-tight text-charcoal leading-[1.15] mb-10 md:mb-12">
            Frequently Asked Questions:
          </h2>

          <div className="border border-charcoal/40 bg-off-white">
            <details
              className={`group border-b border-charcoal/40 last:border-b-0 ${panelMotion} open:bg-charcoal/[0.02]`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6 font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-charcoal outline-none transition-colors hover:bg-charcoal/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 pr-2 text-left">
                  Why analyze raw G-code instead of just rendering the 3D
                  model?
                </span>
                <span
                  className="shrink-0 font-mono text-[10px] text-charcoal/45 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-charcoal/15 px-6 pb-6 pt-4 md:px-8 md:pb-7 md:pt-5 text-charcoal/75 leading-relaxed text-sm md:text-[0.9375rem]">
                Visual rendering is vulnerable to &quot;Trojan Horse&quot;
                attacks. A bad actor can easily hide a restricted component
                (like a silencer baffle or an auto-sear) inside a hollow,
                innocuous 3D shape, like a simple box. Visual AI models will only
                see the box and approve it. Because G-code contains the
                literal, layer-by-layer instructions sent to the printer, our
                model analyzes the internal toolpaths and infill. If a weapon is
                hidden inside, our model detects the kinematics required to
                print it, making it immune to visual spoofing.
              </div>
            </details>

            <details
              className={`group border-b border-charcoal/40 last:border-b-0 ${panelMotion} open:bg-charcoal/[0.02]`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6 font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-charcoal outline-none transition-colors hover:bg-charcoal/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 pr-2 text-left">
                  Can&apos;t general AI models (like ChatGPT or Claude) just read
                  the G-code?
                </span>
                <span
                  className="shrink-0 font-mono text-[10px] text-charcoal/45 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-charcoal/15 px-6 pb-6 pt-4 md:px-8 md:pb-7 md:pt-5 text-charcoal/75 leading-relaxed text-sm md:text-[0.9375rem]">
                <p>
                  No. Frontier language models are built for sequential human
                  language, not millions of lines of spatial coordinates.
                  Standard 3D prints generate massive G-code files that quickly
                  exceed the memory limits (context windows) of general AI. Even
                  when they can ingest the file, they suffer from the &quot;Lost
                  in the Middle&quot; phenomenon, failing to find specific
                  patterns in highly repetitive data. Our model is purpose-built
                  using localized feature extraction to natively understand 3D
                  spatial sequences.
                </p>
                <p className="mt-4">
                  In our testing, all frontier models such as gpt-5.4-xhigh,
                  opus-4.6-high, and gemini-3.1-pro hallucinated and outputted
                  the wrong answer on what the G-code might be printing out.
                </p>
              </div>
            </details>

            <details
              className={`group border-b border-charcoal/40 last:border-b-0 ${panelMotion} open:bg-charcoal/[0.02]`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6 font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-charcoal outline-none transition-colors hover:bg-charcoal/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 pr-2 text-left">
                  Does analyzing G-code add significant latency to the slicing
                  pipeline?
                </span>
                <span
                  className="shrink-0 font-mono text-[10px] text-charcoal/45 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-charcoal/15 px-6 pb-6 pt-4 md:px-8 md:pb-7 md:pt-5 text-charcoal/75 leading-relaxed text-sm md:text-[0.9375rem]">
                Not at all. Because our architecture relies on localized
                feature extraction rather than massive, generalized neural
                networks, inference is highly efficient. The analysis happens
                in milliseconds during the standard slicing pipeline (e.g., via
                CuraEngine), allowing us to flag and halt restricted prints at
                the export gate without bottlenecking your workflow.
              </div>
            </details>

            <details
              className={`group border-b border-charcoal/40 last:border-b-0 ${panelMotion} open:bg-charcoal/[0.02]`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6 font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-charcoal outline-none transition-colors hover:bg-charcoal/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 pr-2 text-left">
                  What exactly is the model looking for in the code?
                </span>
                <span
                  className="shrink-0 font-mono text-[10px] text-charcoal/45 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-charcoal/15 px-6 pb-6 pt-4 md:px-8 md:pb-7 md:pt-5 text-charcoal/75 leading-relaxed text-sm md:text-[0.9375rem]">
                It evaluates the mechanical reality of the print. It looks for
                specific kinematic signatures, such as the tight tolerances of
                a silencer, the specific perimeter layering of a lower receiver,
                or the distinct infill patterns required for high-stress
                firearm components, achieving a 98% detection accuracy rate.
              </div>
            </details>

            <details
              className={`group border-b border-charcoal/40 last:border-b-0 ${panelMotion} open:bg-charcoal/[0.02]`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6 font-mono text-xs md:text-sm font-semibold uppercase tracking-[0.12em] text-charcoal outline-none transition-colors hover:bg-charcoal/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 pr-2 text-left">
                  How does this integrate with existing systems?
                </span>
                <span
                  className="shrink-0 font-mono text-[10px] text-charcoal/45 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-charcoal/15 px-6 pb-6 pt-4 md:px-8 md:pb-7 md:pt-5 text-charcoal/75 leading-relaxed text-sm md:text-[0.9375rem]">
                It integrates seamlessly as a localized step in your existing
                automated slicing pipeline. Once your backend (e.g., Node.js)
                calls the slicer to generate the G-code, our model analyzes the
                output file and returns a binary classification and confidence
                score, which your system can use to automatically update the
                export gate status.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
