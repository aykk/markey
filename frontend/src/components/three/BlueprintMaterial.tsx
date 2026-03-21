"use client";

import { forwardRef, useEffect, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { MeshStandardMaterial } from "three";

type BlueprintMaterialProps = ThreeElements["meshStandardMaterial"];

/**
 * Premium monochromatic “x-ray blueprint” look for meshes.
 * Apply as a child of `<mesh>` alongside your geometry.
 *
 * @example
 * ```tsx
 * <mesh>
 *   <boxGeometry args={[1, 1, 1]} />
 *   <BlueprintMaterial />
 * </mesh>
 * ```
 */
export const BlueprintMaterial = forwardRef<
  MeshStandardMaterial,
  BlueprintMaterialProps
>(function BlueprintMaterial(props, ref) {
  return (
    <meshStandardMaterial
      ref={ref}
      color="#06b6d4"
      transparent
      opacity={0.9}
      wireframe
      {...props}
    />
  );
});

BlueprintMaterial.displayName = "BlueprintMaterial";

const BLUEPRINT_PROPS = {
  color: "#06b6d4",
  transparent: true,
  opacity: 0.9,
  wireframe: true,
} as const;

/**
 * Single shared Three.js material matching {@link BlueprintMaterial} — use when
 * applying the same wireframe to many meshes (e.g. GLTF) to avoid duplicate materials.
 */
export function useBlueprintMaterial(): MeshStandardMaterial {
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        ...BLUEPRINT_PROPS,
      }),
    []
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return material;
}
