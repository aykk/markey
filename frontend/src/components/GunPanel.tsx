"use client";

import { HeroCanvas } from "@/components/three/HeroCanvas";

/**
 * Gun model panel for split-screen layout.
 * @param exploded 0–1: 0 = collapsed/assembled, 1 = fully exploded
 */
export function GunPanel({ exploded = 0 }: { exploded?: number }) {
  return (
    <div className="relative w-full h-full min-h-[50vh] md:min-h-dvh">
      <HeroCanvas exploded={exploded} />
    </div>
  );
}
