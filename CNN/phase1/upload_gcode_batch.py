"""Read a batch of gcode files, parse them (Phase 2), and upload to the HF
dataset repo ``jungter/augmented-g-code`` as:
  - Raw gcode files under ``gcode/``
  - A Parquet shard under ``data/`` with columns ``toolpath_json`` and ``label``

Phase 2 parsing strips all non-movement commands (temperatures, comments,
machine limits) and extracts absolute-coordinate toolpaths from G0/G1/G2/G3.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile

TMP_DIR = "G:\\markeyTemp"
RESULT_PREFIX = "___RESULT___:"

from datasets import Dataset
from huggingface_hub import HfApi

# Phase 2 parser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "phase2"))
from parse_gcode import parse_gcode_file

REPO_ID = "jungter/augmented-g-code"


def _parse_one(file_path: str) -> dict:
    """Parse a single gcode file. Runs in a worker process.
    Returns only lightweight metadata; toolpath JSON is written to a temp file."""
    toolpaths = parse_gcode_file(file_path)
    filename = os.path.basename(file_path)
    # Write parsed JSON to a temp file instead of returning it in memory
    tmp = tempfile.NamedTemporaryFile(
        dir="H:\\markeyTempH", suffix=".parsed", delete=False, mode="w"
    )
    json.dump(toolpaths, tmp)
    tmp.close()
    return {
        "file_path": file_path,
        "filename": filename,
        "parsed_path": tmp.name,
        "num_moves": len(toolpaths),
    }


def main() -> int:
    # --- list-uploaded mode (no side effects) ---
    if len(sys.argv) > 1 and sys.argv[1] == "--list-uploaded":
        import huggingface_hub
        huggingface_hub.logging.set_verbosity_error()
        api = HfApi()
        try:
            files = api.list_repo_files(REPO_ID, repo_type="dataset")
            gcode_files = [f for f in files if f.startswith("gcode/")]
            print(f"{RESULT_PREFIX}{json.dumps([os.path.basename(f) for f in gcode_files])}")
        except Exception as e:
            print(f"{RESULT_PREFIX}{json.dumps({'error': str(e)})}")
            return 1
        return 0

    # --- normal upload mode ---
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
        with open(input_path, "r") as f:
            entries: list[dict] = json.load(f)
    else:
        entries = json.load(sys.stdin)

    if not entries:
        print(f"{RESULT_PREFIX}{json.dumps({'uploaded': [], 'failed': []})}")
        return 0

    import shutil
    from concurrent.futures import ProcessPoolExecutor, as_completed

    import huggingface_hub
    import pyarrow as pa
    import pyarrow.parquet as pq

    huggingface_hub.logging.set_verbosity_error()
    api = HfApi()

    UPLOAD_THRESHOLD = 5 * 1024 * 1024 * 1024  # 25 GB

    staging_dir = tempfile.mkdtemp(dir=TMP_DIR, prefix="hf-stage-")
    gcode_staging = os.path.join(staging_dir, "gcode")
    data_staging = os.path.join(staging_dir, "data")
    os.makedirs(gcode_staging, exist_ok=True)
    os.makedirs("H:\\markeyTempH", exist_ok=True)
    os.makedirs(data_staging, exist_ok=True)

    # Determine starting shard number
    try:
        existing_files = api.list_repo_files(REPO_ID, repo_type="dataset")
        shard_num = len([f for f in existing_files if f.startswith("data/") and f.endswith(".parquet")])
    except Exception:
        shard_num = 0

    valid_entries: list[dict] = []
    skipped: list[dict] = []
    for entry in entries:
        file_path = entry["path"]
        if not os.path.exists(file_path):
            skipped.append({"file": file_path, "error": "not found"})
            continue
        valid_entries.append(entry)

    num_workers = 12
    print(f"  Parsing {len(valid_entries)} files with {num_workers} workers...", file=sys.stderr)

    uploaded: list[str] = []
    failed: list[dict] = list(skipped)

    # Accumulate parsed results; flush+upload every ~25GB of raw gcode
    batch_parsed: list[str] = []   # .parsed temp file paths
    batch_labels: list[int] = []
    batch_uploaded: list[str] = []
    batch_bytes = 0                # tracked raw gcode bytes

    def flush_batch():
        nonlocal shard_num, batch_bytes
        if not batch_parsed:
            return
        shard_num += 1
        print(f"\n  Building Parquet shard {shard_num} from {len(batch_parsed)} files...", file=sys.stderr)

        schema = pa.schema([pa.field("toolpath_json", pa.string()), pa.field("label", pa.int64())])
        parquet_path = os.path.join(data_staging, f"batch_{shard_num:04d}.parquet")
        writer = pq.ParquetWriter(parquet_path, schema)

        chunk_jsons: list[str] = []
        chunk_labels_list: list[int] = []
        chunk_bytes = 0
        CHUNK_BYTES = 5 * 1024 * 1024 * 1024

        for j, pf in enumerate(batch_parsed):
            with open(pf, "r") as f:
                tj = f.read()
            os.unlink(pf)
            chunk_jsons.append(tj)
            chunk_labels_list.append(batch_labels[j])
            chunk_bytes += len(tj)
            if chunk_bytes >= CHUNK_BYTES or j == len(batch_parsed) - 1:
                table = pa.table({"toolpath_json": chunk_jsons, "label": chunk_labels_list}, schema=schema)
                writer.write_table(table)
                chunk_jsons.clear()
                chunk_labels_list.clear()
                chunk_bytes = 0

        writer.close()

        api.upload_folder(
            folder_path=staging_dir,
            repo_id=REPO_ID,
            repo_type="dataset",
            commit_message=f"Upload batch {shard_num}: {len(batch_uploaded)} files",
        )
        print(f"  Committed batch {shard_num}: {len(batch_uploaded)} gcode files + data/batch_{shard_num:04d}.parquet", file=sys.stderr)

        # Delete uploaded raw gcode files from staging
        for fp in batch_uploaded:
            lp = os.path.join(gcode_staging, os.path.basename(fp))
            try:
                os.unlink(lp)
            except OSError:
                pass
        
        # Delete the uploaded parquet file to avoid re-uploading it in the next batch
        try:
            os.unlink(parquet_path)
        except OSError:
            pass

        # Also delete local copies
        for fp in batch_uploaded:
            try:
                os.unlink(fp)
            except OSError:
                pass

        uploaded.extend(batch_uploaded)
        batch_parsed.clear()
        batch_labels.clear()
        batch_uploaded.clear()
        batch_bytes = 0

    import signal

    shutting_down = False

    def _signal_handler(signum, frame):
        nonlocal shutting_down
        if shutting_down:
            # Second Ctrl+C: force exit
            sys.stderr.write("\n  Force exit.\n")
            sys.exit(1)
        shutting_down = True
        sys.stderr.write("\n  Ctrl+C caught, shutting down gracefully (Ctrl+C again to force)...\n")

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    # Submit tasks in limited batches so temp files don't explode on disk.
    # Each worker produces ~2.3x its raw file in .parsed temp. With 16 workers
    # and a 25GB threshold we keep at most ~25GB + (16 * largest file) on disk.
    SUBMIT_BATCH = num_workers * 4  # keep a small lookahead buffer

    with ProcessPoolExecutor(max_workers=num_workers) as pool:
        total = len(valid_entries)
        entry_idx = 0
        done_count = 0

        # Seed initial batch of futures
        pending: dict = {}
        while entry_idx < total and len(pending) < SUBMIT_BATCH:
            e = valid_entries[entry_idx]
            pending[pool.submit(_parse_one, e["path"])] = e
            entry_idx += 1

        while pending and not shutting_down:
            # Wait for next completed future
            done_futures = []
            for fut in list(pending.keys()):
                if fut.done():
                    done_futures.append(fut)

            if not done_futures:
                # None done yet, wait for the first one
                import concurrent.futures
                done_futures = [concurrent.futures.wait(pending, return_when=concurrent.futures.FIRST_COMPLETED).done.pop()]

            for future in done_futures:
                entry = pending.pop(future)
                done_count += 1
                try:
                    result = future.result()
                    batch_parsed.append(result["parsed_path"])
                    batch_labels.append(entry["label"])
                    
                    file_path = result["file_path"]
                    batch_uploaded.append(file_path)
                    
                    filename = os.path.basename(file_path)
                    link_path = os.path.join(gcode_staging, filename)
                    try:
                        os.symlink(file_path, link_path)
                    except OSError:
                        shutil.copy2(file_path, link_path)

                    try:
                        batch_bytes += os.path.getsize(file_path)
                    except OSError:
                        pass
                except Exception as e:
                    failed.append({"file": entry["path"], "error": str(e)})

                # Submit next task to keep workers busy
                if entry_idx < total:
                    e = valid_entries[entry_idx]
                    pending[pool.submit(_parse_one, e["path"])] = e
                    entry_idx += 1

            sys.stderr.write(f"\r  Parsing: {done_count}/{total} ({done_count * 100 // total}%) batch: {batch_bytes / 1e9:.1f}/{UPLOAD_THRESHOLD / 1e9:.0f} GB")
            sys.stderr.flush()

            # Flush when accumulated raw gcode hits threshold
            if batch_bytes >= UPLOAD_THRESHOLD:
                flush_batch()

    # Final flush (also handles partial batch on shutdown)
    flush_batch()

    if shutting_down:
        print(f"\n  Shutdown complete. Uploaded {len(uploaded)} files.", file=sys.stderr)
    else:
        print(f"\n  Total uploaded: {len(uploaded)}, failed: {len(failed)}", file=sys.stderr)

    # Clean up any remaining .parsed temp files
    for pf in batch_parsed:
        try:
            os.unlink(pf)
        except OSError:
            pass

    shutil.rmtree(staging_dir, ignore_errors=True)

    result = {"uploaded": uploaded, "failed": failed}
    print(f"{RESULT_PREFIX}{json.dumps(result)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
