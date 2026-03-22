import os
import sys

from render_stl_views import load_single_mesh


def export_mesh_as_stl(input_path: str, output_path: str) -> str:
    if not input_path:
        raise ValueError("No input path provided.")
    if not output_path:
        raise ValueError("No output path provided.")

    mesh = load_single_mesh(input_path)

    output_path = os.path.abspath(os.path.expanduser(output_path))
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    mesh.export(output_path, file_type="stl")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python export_mesh_stl.py <input_mesh> <output_stl>")
        sys.exit(1)

    try:
        out_path = export_mesh_as_stl(sys.argv[1], sys.argv[2])
        print(out_path)
    except Exception as exc:
        print(f"Error: {exc}")
        sys.exit(1)
