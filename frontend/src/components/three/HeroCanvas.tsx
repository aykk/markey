"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { DiagramGun } from "./DiagramGun";

export interface HeroCanvasProps {
  /** True when pointer is over the hero — drives exploded blueprint motion */
  exploded?: boolean;
}

/**
 * Full-bleed WebGL scene: GLTF diagram + orbit + blueprint materials.
 * Parent should be a positioned container with explicit height (e.g. h-screen).
 */
export function HeroCanvas({ exploded = false }: HeroCanvasProps) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{ position: [0.35, 0.2, 0.55], fov: 42 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      frameloop="always"
    >
      <color attach="background" args={["#f8fafc"]} />

      <ambientLight intensity={0.92} />
      <directionalLight position={[6, 8, 5]} intensity={1.05} />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} />
      <Environment preset="studio" environmentIntensity={0.4} />

      <Suspense fallback={null}>
        <group position={[0, -0.05, 0]} scale={2.2}>
          <DiagramGun exploded={exploded} />
        </group>
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={0.35}
        maxDistance={2.5}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
