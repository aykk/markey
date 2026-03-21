import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-off-white px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.2em] text-charcoal/60 hover:text-charcoal uppercase mb-12 inline-block"
        >
          ← Back
        </Link>
        <h1 className="font-mono text-2xl tracking-[0.2em] text-charcoal uppercase mb-6">
          Demo
        </h1>
        <p className="text-charcoal/80 leading-relaxed">
          Demo coming soon.
        </p>
      </div>
    </main>
  );
}
