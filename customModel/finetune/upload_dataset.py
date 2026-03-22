"""Upload g-code data + manifest to HuggingFace dataset: jungter/gcode-to-model-gn"""
import json
from pathlib import Path
from datasets import Dataset
from huggingface_hub import login

# login() — uncomment if not already logged in, or run `huggingface-cli login` first

DATA_DIR = Path("../data-prep/g-code-spliced")
NON_GUN_DIR = Path("../data-prep/g-code-non-gun")
MANIFEST_PATH = Path("../data-prep/stl-manifest.json")
REPO_ID = "jungter/gcode-to-model-gn"

with open(MANIFEST_PATH, "r") as f:
    manifest = json.load(f)


def generate_rows():
    """Yield one row at a time to avoid loading everything into memory."""
    # Gun parts (label=1)
    for entry in manifest:
        if "gcode" not in entry:
            continue
        gcode_path = DATA_DIR / entry["gcode"]
        if not gcode_path.exists():
            print(f"Skipping missing file: {gcode_path}")
            continue
        with open(gcode_path, "r", errors="ignore") as f:
            gcode_text = f.read()
        yield {
            "gcode_text": gcode_text,
            "filename": entry["gcode"],
            "label": 1,
            "category": entry.get("category", ""),
            "subcategory": entry.get("subcategory", ""),
            "item": entry.get("item", ""),
            "part": entry.get("part", ""),
            "part_labels": entry.get("labels", []),
        }

    # Non-gun parts (label=0)
    if NON_GUN_DIR.exists():
        for gcode_path in sorted(NON_GUN_DIR.glob("*.gcode")):
            with open(gcode_path, "r", errors="ignore") as f:
                gcode_text = f.read()
            yield {
                "gcode_text": gcode_text,
                "filename": gcode_path.name,
                "label": 0,
                "category": "non-gun",
                "subcategory": "",
                "item": "",
                "part": gcode_path.stem,
                "part_labels": [],
            }


ds = Dataset.from_generator(generate_rows)
print(f"Dataset: {ds}")
print(f"  Gun parts: {sum(1 for l in ds['label'] if l == 1)}")
print(f"  Non-gun parts: {sum(1 for l in ds['label'] if l == 0)}")

ds.push_to_hub(REPO_ID, private=False)
print(f"\nUploaded to https://huggingface.co/datasets/{REPO_ID}")
