"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { RefObject } from "react";
import { Suspense, useEffect } from "react";
import { DiagramGun } from "./DiagramGun";
import * as THREE from "three";

export interface HeroCanvasProps {
  /** 0–1 progress driving exploded blueprint motion (e.g. from scroll) */
  exploded?: number;
  /** @deprecated OrbitControls removed; no longer used */
  controlsRef?: RefObject<{ dollyIn: (d?: number) => void; dollyOut: (d?: number) => void } | null>;
}

const MODEL_CENTER: [number, number, number] = [1.1, 0.87, 0];
const CAMERA_POSITION: [number, number, number] = [2.5, 0.87, 0];

function FixedCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(new THREE.Vector3(...MODEL_CENTER));
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export function HeroCanvas({ exploded = 0, controlsRef: _ }: HeroCanvasProps) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{
        position: CAMERA_POSITION,
        fov: 42,
        near: 0.1,
        far: 100,
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 1);
        camera.lookAt(new THREE.Vector3(...MODEL_CENTER));
      }}
      dpr={[1, 2]}
      frameloop="always"
    >
      <FixedCamera />
      <OrbitControls
        target={MODEL_CENTER}
        enableZoom={false}
        enablePan={false}
      />
      <ambientLight intensity={0.92} />
      <directionalLight position={[6, 8, 5]} intensity={1.05} />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} />
      <Environment preset="studio" environmentIntensity={0.4} />

      <Suspense fallback={null}>
        <group position={[MODEL_CENTER[0], MODEL_CENTER[1], MODEL_CENTER[2] - 0.05]} scale={1.5}>
          <DiagramGun exploded={exploded} />
        </group>
      </Suspense>
    </Canvas>
  );
}
