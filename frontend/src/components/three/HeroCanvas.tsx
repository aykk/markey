"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { applyPageBackgroundToRenderer } from "@/lib/canvasBackground";
import { DiagramGun } from "./DiagramGun";
import * as THREE from "three";

export interface HeroCanvasProps {
  /** 0–1 progress driving exploded blueprint motion (e.g. from scroll) */
  exploded?: number;
}

const MODEL_CENTER: [number, number, number] = [0.8, 0.87, 0];
const CAMERA_POSITION: [number, number, number] = [2.2, 0.87, 0];

/** Fixed camera distance from target (orbit + auto-rotate only; no zoom) */
const FIXED_CAMERA_DISTANCE = new THREE.Vector3(...CAMERA_POSITION).distanceTo(
  new THREE.Vector3(...MODEL_CENTER)
);

export function HeroCanvas({ exploded = 0 }: HeroCanvasProps) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{
        position: CAMERA_POSITION,
        fov: 42,
        near: 0.1,
        far: 100,
      }}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
      }}
      onCreated={({ gl, camera }) => {
        applyPageBackgroundToRenderer(gl);
        camera.lookAt(new THREE.Vector3(...MODEL_CENTER));
      }}
      dpr={[1, 2]}
      frameloop="always"
    >
      <OrbitControls
        target={MODEL_CENTER}
        enableDamping
        dampingFactor={0.06}
        enableZoom={false}
        minDistance={FIXED_CAMERA_DISTANCE}
        maxDistance={FIXED_CAMERA_DISTANCE}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI - 0.35}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.12}
      />

      <ambientLight intensity={0.92} />
      <directionalLight position={[6, 8, 5]} intensity={1.05} />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} />
      <Environment preset="studio" environmentIntensity={0.4} />

      <Suspense fallback={null}>
        <group position={MODEL_CENTER} scale={1.5}>
          <DiagramGun exploded={exploded} />
        </group>
      </Suspense>
    </Canvas>
  );
}
