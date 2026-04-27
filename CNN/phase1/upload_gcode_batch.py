"""Read a batch of gcode files and upload them to the HF dataset repo
``jungter/augmented-g-code`` as:
  - Raw gcode files under ``gcode/``
  - A Parquet shard under ``data/`` with columns ``gcode_text`` and ``label``

Accepts a JSON array of ``{"path": "...", "label": 1|0}`` objects via stdin
or as a JSON file path argument.  Files are deleted from disk after upload.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile

from datasets import Dataset
from huggingface_hub import HfApi, login

REPO_ID = "jungter/augmented-g-code"


def main() -> int:
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
        with open(input_path, "r") as f:
            entries: list[dict] = json.load(f)
    else:
        entries = json.load(sys.stdin)

    if not entries:
        print(json.dumps({"uploaded": [], "failed": []}))
        return 0

    login()

    api = HfApi()
    gcode_texts: list[str] = []
    labels: list[int] = []
    uploaded: list[str] = []
    failed: list[dict] = []

    for entry in entries:
        file_path = entry["path"]
        label = entry["label"]
        if not os.path.exists(file_path):
            failed.append({"file": file_path, "error": "not found"})
            continue
        try:
            with open(file_path, "r", errors="ignore") as f:
                text = f.read()
            filename = os.path.basename(file_path)

            # Upload raw gcode file
            api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo=f"gcode/{filename}",
                repo_id=REPO_ID,
                repo_type="dataset",
            )

            gcode_texts.append(text)
            labels.append(label)
            uploaded.append(file_path)
            print(f"  Uploaded gcode/{filename} (label={label})", file=sys.stderr)
        except Exception as e:
            failed.append({"file": file_path, "error": str(e)})

    if gcode_texts:
        # Build a Parquet shard for this batch
        batch_ds = Dataset.from_dict({"gcode_text": gcode_texts, "label": labels})
        with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as tmp:
            tmp_path = tmp.name
        batch_ds.to_parquet(tmp_path)

        # Determine shard number from existing data files
        try:
            existing_files = api.list_repo_files(REPO_ID, repo_type="dataset")
            existing_data = [f for f in existing_files if f.startswith("data/") and f.endswith(".parquet")]
            shard_num = len(existing_data) + 1
        except Exception:
            shard_num = 1

        shard_path = f"data/batch_{shard_num:04d}.parquet"
        api.upload_file(
            path_or_fileobj=tmp_path,
            path_in_repo=shard_path,
            repo_id=REPO_ID,
            repo_type="dataset",
        )
        os.unlink(tmp_path)
        print(f"  Uploaded {shard_path} ({len(batch_ds)} rows)", file=sys.stderr)

    result = {"uploaded": uploaded, "failed": failed}
    print(json.dumps(result))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
