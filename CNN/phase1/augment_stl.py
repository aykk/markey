"""Anisotropic STL scaling per Phase 1 of CNN/guide.md.

Applies a single-axis stretch (1% to 3%) to an input STL and writes the
augmented mesh to the given output path. This is called by
``generate_dataset.js`` once per variant so that every sliced G-code is
generated from a mathematically distinct mesh.
"""

from __future__ import annotations

import argparse
import os
import random
import sys

import numpy as np
import trimesh


def anisotropic_scale(mesh: trimesh.Trimesh,
                      axis: str | None = None,
                      scale: float | None = None,
                      seed: int | None = None) -> tuple[str, float]:
    """Stretch the mesh on a single random axis between 1.01x and 1.03x."""
    rng = random.Random(seed)
    if axis is None:
        axis = rng.choice(["x", "y", "z"])
    if scale is None:
        scale = 1.0 + rng.uniform(0.01, 0.03)

    axis_idx = "xyz".index(axis)
    factors = np.array([1.0, 1.0, 1.0], dtype=np.float64)
    factors[axis_idx] = scale

    transform = np.eye(4)
    transform[0, 0] = factors[0]
    transform[1, 1] = factors[1]
    transform[2, 2] = factors[2]

    mesh.apply_transform(transform)
    return axis, float(scale)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="Path to input .stl file")
    ap.add_argument("output", help="Path where augmented .stl will be written")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--axis", choices=["x", "y", "z"], default=None)
    ap.add_argument("--scale", type=float, default=None,
                    help="Explicit scale factor (e.g. 1.025). Random if omitted.")
    args = ap.parse_args()

    try:
        mesh = trimesh.load(args.input, force="mesh")
    except Exception as exc:
        print(f"ERROR loading mesh: {exc}", file=sys.stderr)
        return 2

    if mesh is None or mesh.is_empty or len(mesh.faces) == 0:
        print("ERROR empty mesh", file=sys.stderr)
        return 2

    axis, scale = anisotropic_scale(mesh, args.axis, args.scale, args.seed)

    out_dir = os.path.dirname(os.path.abspath(args.output))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    mesh.export(args.output)
    print(f"OK axis={axis} scale={scale:.6f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
