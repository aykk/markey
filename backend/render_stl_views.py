import os
import sys
import numpy as np
import trimesh
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

SUPPORTED_EXTENSIONS = {
    ".stl",
    ".obj",
    ".ply",
    ".off",
    ".glb",
    ".gltf"
}

def resolve_input_path(model_path: str) -> str:
    if not model_path:
        raise ValueError("No model path provided.")

    abs_path = os.path.abspath(os.path.expanduser(model_path))

    if not os.path.isfile(abs_path):
        raise FileNotFoundError(f"Model file not found: {abs_path}")

    ext = os.path.splitext(abs_path)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {ext}. "
            f"Supported types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    return abs_path


def load_single_mesh(model_path: str) -> trimesh.Trimesh:
    model_path = resolve_input_path(model_path)
    ext = os.path.splitext(model_path)[1].lower()

    try:
        loaded = trimesh.load(model_path, force="scene")
    except Exception as e:
        raise ValueError(f"Failed to load model '{model_path}': {e}")

    if isinstance(loaded, trimesh.Trimesh):
        mesh = loaded

    elif isinstance(loaded, trimesh.Scene):
        meshes = []
        for g in loaded.geometry.values():
            if isinstance(g, trimesh.Trimesh) and g.vertices is not None and g.faces is not None and len(g.faces) > 0:
                meshes.append(g)

        if not meshes:
            raise ValueError(f"No usable mesh geometry found in file: {model_path}")

        if len(meshes) == 1:
            mesh = meshes[0]
        else:
            mesh = trimesh.util.concatenate(meshes)

    else:
        raise ValueError(f"Could not interpret file as a mesh: {model_path}")

    if not isinstance(mesh, trimesh.Trimesh):
        raise ValueError(f"Loaded object is not a mesh: {type(mesh)}")

    if mesh.faces is None or len(mesh.faces) == 0:
        raise ValueError(f"Mesh has no faces: {model_path}")

    if mesh.vertices is None or len(mesh.vertices) == 0:
        raise ValueError(f"Mesh has no vertices: {model_path}")

    return mesh


def normalize_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mesh = mesh.copy()

    # Center model at origin
    mesh.apply_translation(-mesh.bounding_box.centroid)

    # Uniformly scale to fit into a standard view cube
    extents = mesh.bounding_box.extents
    max_extent = float(np.max(extents))

    if max_extent > 0:
        mesh.apply_scale(2.0 / max_extent)

    return mesh


def setup_axes(ax, mesh: trimesh.Trimesh):
    verts = mesh.vertices
    x, y, z = verts[:, 0], verts[:, 1], verts[:, 2]

    max_range = max(
        float(x.max() - x.min()),
        float(y.max() - y.min()),
        float(z.max() - z.min())
    ) / 2.0

    if max_range == 0:
        max_range = 1.0

    mid_x = float((x.max() + x.min()) / 2.0)
    mid_y = float((y.max() + y.min()) / 2.0)
    mid_z = float((z.max() + z.min()) / 2.0)

    ax.set_xlim(mid_x - max_range, mid_x + max_range)
    ax.set_ylim(mid_y - max_range, mid_y + max_range)
    ax.set_zlim(mid_z - max_range, mid_z + max_range)

    ax.set_box_aspect((1, 1, 1))
    ax.set_axis_off()


def render_view(mesh: trimesh.Trimesh, out_path: str, elev: float, azim: float):
    fig = plt.figure(figsize=(6, 6), dpi=200)
    ax = fig.add_subplot(111, projection="3d")

    triangles = mesh.vertices[mesh.faces]

    collection = Poly3DCollection(
        triangles,
        linewidths=0.05,
        edgecolors="black",
        alpha=1.0
    )
    collection.set_facecolor((0.75, 0.80, 0.90, 1.0))
    ax.add_collection3d(collection)

    setup_axes(ax, mesh)

    try:
        ax.set_proj_type("ortho")
    except Exception:
        pass

    ax.view_init(elev=elev, azim=azim)

    plt.tight_layout(pad=0)
    plt.savefig(out_path, bbox_inches="tight", pad_inches=0.02)
    plt.close(fig)


def render_views(model_path: str, output_dir: str = "renders"):
    model_path = resolve_input_path(model_path)

    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    mesh = load_single_mesh(model_path)
    mesh = normalize_mesh(mesh)

    views = {
        "top": (90, -90),
        "bottom": (-90, -90),
        "front": (0, -90),
        "back": (0, 90),
        "left": (0, 180),
        "right": (0, 0),
    }

    for name, (elev, azim) in views.items():
        out_path = os.path.join(output_dir, f"{name}.png")
        render_view(mesh, out_path, elev, azim)

    print(f"Saved 6 rendered views to: {output_dir}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python render_stl_views.py <file.stl|file.obj|file.fbx> [output_dir]")
        sys.exit(1)

    model_file = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "renders"

    try:
        render_views(model_file, out_dir)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)