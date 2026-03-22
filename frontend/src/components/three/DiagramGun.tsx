"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type GroupProps = ThreeElements["group"];
type MeshProps = ThreeElements["mesh"];
import { animated, useSpring } from "@react-spring/three";
import type { PropsWithChildren } from "react";
import type { BufferGeometry, MeshStandardMaterial } from "three";
import { useBlueprintMaterial } from "./BlueprintMaterial";

useGLTF.preload("/diagramgun.glb");

/** Exploded offsets (model space) , spread horizontally for landscape hero */
const EXPLODE = {
  barrel: { x: 0.12, y: 0, z: 0.06 },
  slide: { x: 0.08, y: 0.01, z: 0.08 },
  receiver: { x: -0.1, y: -0.02, z: -0.08 },
  magazine: { x: -0.12, y: -0.03, z: -0.1 },
} as const;

const springConfig = { mass: 0.65, tension: 120, friction: 22 };

type NodeMap = Record<string, { geometry: BufferGeometry } | undefined>;

function MeshWire({
  geometry,
  material,
  ...props
}: {
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
} & MeshProps) {
  return <mesh geometry={geometry} material={material} {...props} />;
}

function ExplodedPart({
  progress,
  axis,
  children,
}: PropsWithChildren<{
  progress: number;
  axis: { x: number; y: number; z: number };
}>) {
  const { x, y, z } = useSpring({
    x: progress * axis.x,
    y: progress * axis.y,
    z: progress * axis.z,
    config: springConfig,
  });

  return (
    <animated.group position-x={x} position-y={y} position-z={z}>
      {children}
    </animated.group>
  );
}

export interface DiagramGunProps extends GroupProps {
  /** 0–1 progress: sub-assemblies translate apart (exploded blueprint) */
  exploded?: number;
}

/**
 * G17-style exploded diagram from `public/diagramgun.glb`.
 * All meshes use the shared blueprint wireframe material.
 */
export function DiagramGun({ exploded = 0, ...props }: DiagramGunProps) {
  const { nodes } = useGLTF("/diagramgun.glb") as unknown as { nodes: NodeMap };
  const blueprint = useBlueprintMaterial();

  return (
    <group {...props} dispose={null}>
      {/* Receiver , frame, plug, trigger pack, cartridges, outline planes */}
      <ExplodedPart progress={exploded} axis={EXPLODE.receiver}>
        <MeshWire
          geometry={nodes["35_Plug_low"]!.geometry}
          material={blueprint}
        />
        <MeshWire
          geometry={nodes["17_Frame_a_low"]!.geometry}
          material={blueprint}
          rotation={[0.384, 0, 0]}
        />
        <MeshWire
          geometry={nodes["17_Frame_b_low"]!.geometry}
          material={blueprint}
          rotation={[0.384, 0, 0]}
        />
        <MeshWire
          geometry={nodes["17_Frame_c_low"]!.geometry}
          material={blueprint}
          rotation={[0.384, 0, 0]}
        />
        <MeshWire
          geometry={nodes["17_Frame_d_low"]!.geometry}
          material={blueprint}
        />
        <MeshWire
          geometry={nodes["19_Magazine_Catch_low"]!.geometry}
          material={blueprint}
        />
        <MeshWire
          geometry={nodes["22_Locking_Block_low"]!.geometry}
          material={blueprint}
          position={[0, 0.037, 0]}
        />
        <MeshWire
          geometry={nodes["26_Trigger_a_low"]!.geometry}
          material={blueprint}
          position={[0, 0.09, 0.023]}
        />
        <MeshWire
          geometry={nodes["26_Trigger_c_low"]!.geometry}
          material={blueprint}
          position={[0, 0.09, 0.023]}
        />
        <MeshWire
          geometry={nodes["26_Trigger_b_low"]!.geometry}
          material={blueprint}
          position={[0, 0.09, 0.023]}
        />
        <MeshWire
          geometry={nodes["28_Trigger_Pin_low"]!.geometry}
          material={blueprint}
          position={[0.055, 0, 0]}
        />
        <MeshWire
          geometry={nodes["34_Locking_Block_Pin_low"]!.geometry}
          material={blueprint}
          position={[0.042, 0.006, 0.01]}
        />
        <MeshWire
          geometry={nodes["26_Trigger_Bar_low"]!.geometry}
          material={blueprint}
          position={[0, 0.09, 0.023]}
        />
        <MeshWire
          geometry={nodes["23_Trigger_Mechanism_Housing_low"]!.geometry}
          material={blueprint}
          position={[0, 0.053, 0.019]}
        />
        <MeshWire
          geometry={nodes["25_Trigger_Spiring_low"]!.geometry}
          material={blueprint}
          position={[0, 0.076, 0.02]}
        />
        <MeshWire
          geometry={nodes["24_Connector_low"]!.geometry}
          material={blueprint}
          position={[0, 0.077, -0.018]}
        />
        <MeshWire
          geometry={nodes["23_Ejector_low"]!.geometry}
          material={blueprint}
          position={[0.013, 0.09, 0.023]}
        />
        <MeshWire
          geometry={nodes["29_Trigger_Housing_Pin_low"]!.geometry}
          material={blueprint}
          position={[0.037, 0.024, 0.062]}
        />
        <MeshWire
          geometry={nodes["00_Cartridge_a_low"]!.geometry}
          material={blueprint}
          position={[0, -0.05, 0]}
        />
        <MeshWire
          geometry={nodes["00_Cartridge_b_low"]!.geometry}
          material={blueprint}
          position={[0, -0.075, 0]}
        />
        <MeshWire
          geometry={nodes["Plane002"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.23, -0.077]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={0.001}
        />
        <MeshWire
          geometry={nodes["Plane"]!.geometry}
          material={blueprint}
          position={[0, 0.028, -0.048]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={[0.013, 0, 0]}
        />
        <MeshWire
          geometry={nodes["Plane001"]!.geometry}
          material={blueprint}
          position={[0, 0.082, -0.061]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={[0.013, 0, 0]}
        />
        <MeshWire
          geometry={nodes["Plane003"]!.geometry}
          material={blueprint}
          position={[0, 0.072, 0.009]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={[0.013, 0, 0]}
        />
        <MeshWire
          geometry={nodes["Plane004"]!.geometry}
          material={blueprint}
          position={[0, 0.034, -0.002]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={[0.013, 0, 0]}
        />
        <MeshWire
          geometry={nodes["Plane005"]!.geometry}
          material={blueprint}
          position={[0, 0.13, 0.179]}
          rotation={[0, 0, -Math.PI / 2]}
          scale={[0.016, 0, 0]}
        />
        <MeshWire
          geometry={nodes["Plane006"]!.geometry}
          material={blueprint}
          position={[-0.038, 0.149, -0.002]}
          scale={0.001}
        />
      </ExplodedPart>

      {/* Slide + upper small parts */}
      <ExplodedPart progress={exploded} axis={EXPLODE.slide}>
        <MeshWire
          geometry={nodes["16_Sights_a_low"]!.geometry}
          material={blueprint}
          position={[-0.038, 0.124, 0.116]}
        />
        <MeshWire
          geometry={nodes["16_Sights_b_low"]!.geometry}
          material={blueprint}
          position={[0, 0.137, 0.116]}
        />
        <MeshWire
          geometry={nodes["16_Sights_c_low"]!.geometry}
          material={blueprint}
          position={[0, 0.124, 0.116]}
        />
        <MeshWire
          geometry={nodes["15_Slide_Cover_Plate_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.096, 0.112]}
        />
        <MeshWire
          geometry={nodes["01_Slide_low"]!.geometry}
          material={blueprint}
          position={[0, 0.124, 0.116]}
        />
        <MeshWire
          geometry={nodes["11_Extractor_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.162, 0.005]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["04_Recil_Spiring_b1_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["04_Recil_Spiring_b2_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["04_Recil_Spiring_a2_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["04_Recil_Spiring_a1_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["07_Firing_Pin_Spiring1_low"]!.geometry}
          material={blueprint}
          position={[0.031, 0.139, -0.009]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["07_Firing_Pin_Spiring2_low"]!.geometry}
          material={blueprint}
          position={[0.031, 0.139, -0.009]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["05_Firing_Pin_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.107, -0.083]}
        />
        <MeshWire
          geometry={nodes["08_Spring_cups_low"]!.geometry}
          material={blueprint}
          position={[0.031, 0.139, -0.009]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["06_Spacer_Sleeve_low"]!.geometry}
          material={blueprint}
          position={[0.031, 0.139, -0.021]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["20_Slide_Lock_Spiring_low"]!.geometry}
          material={blueprint}
        />
        <MeshWire
          geometry={nodes["21_Slide_Lock_low"]!.geometry}
          material={blueprint}
          position={[0.061, 0, 0]}
        />
        <MeshWire
          geometry={nodes["10_Firing_pin_Safety_Spiring_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.162, 0.005]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["09_Firing_Pin_Safety_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.302, -0.117]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["03_Recoil_Spin_Guide_Rod_a_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.053, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["03_Recoil_Spin_Guide_Rod_b_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["03_Recoil_Spin_Guide_Rod_c_low"]!.geometry}
          material={blueprint}
          position={[0.017, 0.083, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["12_Extractor_Depressor_Plunger_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.162, 0.005]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["13_Extractor_Depressor_Plunger_Spiring_low"]!.geometry}
          material={blueprint}
          position={[-0.001, 0.162, -0.001]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["14_Spring_Loaded_Bearing_low"]!.geometry}
          material={blueprint}
          position={[-0.003, 0.163, -0.013]}
          rotation={[0, 0, Math.PI / 2]}
        />
        <MeshWire
          geometry={nodes["27_Slide_Stop_Lever_a_low"]!.geometry}
          material={blueprint}
          position={[0.02, 0.024, 0.006]}
        />
        <MeshWire
          geometry={nodes["27_Slide_Stop_Lever_b_low"]!.geometry}
          material={blueprint}
          position={[0.013, 0.09, 0.023]}
        />
      </ExplodedPart>

      {/* Barrel */}
      <ExplodedPart progress={exploded} axis={EXPLODE.barrel}>
        <MeshWire
          geometry={nodes["02_Barrel_low"]!.geometry}
          material={blueprint}
          position={[0.031, 0.105, 0.14]}
          rotation={[0, 0, Math.PI / 2]}
        />
      </ExplodedPart>

      {/* Magazine */}
      <ExplodedPart progress={exploded} axis={EXPLODE.magazine}>
        <MeshWire
          geometry={nodes["32_Magazine_Floorplate_a_low"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.139, 0.013]}
        />
        <MeshWire
          geometry={nodes["32_Magazine_Floorplate_b_low"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.139, -0.133]}
        />
        <MeshWire
          geometry={nodes["33_Magazite_Tube_low"]!.geometry}
          material={blueprint}
          position={[0, -0.139, -0.045]}
        />
        <MeshWire
          geometry={nodes["30_Follower_low"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.115, -0.121]}
        />
        <MeshWire
          geometry={nodes["31_Magazine_Spring_low"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.129, -0.127]}
        />
        <MeshWire
          geometry={nodes["32_Magazine_Floorplate_a_low001"]!.geometry}
          material={blueprint}
          position={[-0.001, -0.139, -0.045]}
        />
        <MeshWire
          geometry={nodes["33_Magazite_Tube_low001"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.139, -0.045]}
        />
        <MeshWire
          geometry={nodes["31_Magazine_Spring_low001"]!.geometry}
          material={blueprint}
          position={[-0.085, -0.129, -0.127]}
        />
      </ExplodedPart>
    </group>
  );
}
