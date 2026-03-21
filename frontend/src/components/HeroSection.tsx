"use client";

import { useState } from "react";
import { HeroCanvas } from "@/components/three/HeroCanvas";

export function HeroSection() {
  const [heroHovered, setHeroHovered] = useState(false);

  return (
    <section
      className="relative h-dvh w-full min-h-[320px] overflow-hidden"
      onPointerEnter={() => setHeroHovered(true)}
      onPointerLeave={() => setHeroHovered(false)}
    >
      <div className="absolute inset-0">
        <HeroCanvas exploded={heroHovered} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 md:pb-20">
        <p className="font-mono text-[10px] tracking-[0.35em] text-slate-500 uppercase">
          Drag to orbit · hover to explode blueprint
        </p>
      </div>
    </section>
  );
}
