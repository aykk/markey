import { HeroSection } from "@/components/HeroSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeroSection />

      <main className="mx-auto w-full max-w-3xl px-6 py-16 text-slate-800">
        <h2 className="text-lg font-medium tracking-tight text-slate-900">
          3FIL — blueprint view
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The diagram uses a shared wireframe material on every mesh. Major
          assemblies are grouped with{" "}
          <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs">
            Float
          </code>{" "}
          and spring-animated with{" "}
          <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs">
            @react-spring/three
          </code>{" "}
          when you hover the hero.
        </p>
      </main>
    </div>
  );
}
