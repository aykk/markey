"use client";

import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ZoomInIcon, ZoomOutIcon } from "@/components/icons/ViewControlIcons";
import { HeroCanvas } from "@/components/three/HeroCanvas";

const DOLLY_SCALE = 0.92;

/**
 * Gun model panel for split-screen layout.
 * @param exploded 0–1: 0 = collapsed/assembled, 1 = fully exploded
 */
export function GunPanel({ exploded = 0 }: { exploded?: number }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const zoomIn = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.dollyIn(DOLLY_SCALE);
    c.update();
  };

  const zoomOut = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.dollyOut(DOLLY_SCALE);
    c.update();
  };

  return (
    <div className="relative w-full h-full min-h-[50vh] md:min-h-dvh">
      <HeroCanvas exploded={exploded} controlsRef={controlsRef} />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-md border border-charcoal/30 bg-off-white/95 p-2 shadow-sm">
        <button
          type="button"
          onClick={zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded border border-charcoal/30 bg-off-white text-charcoal transition-colors duration-300 ease-out hover:bg-charcoal/10"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomInIcon className="shrink-0" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded border border-charcoal/30 bg-off-white text-charcoal transition-colors duration-300 ease-out hover:bg-charcoal/10"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOutIcon className="shrink-0" />
        </button>
      </div>
    </div>
  );
}
