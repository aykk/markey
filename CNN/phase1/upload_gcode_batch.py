"""Read a batch of gcode files, parse them (Phase 2), and upload to the HF
dataset repo ``jungter/augmented-g-code`` as Parquet shards under ``data/``
with columns ``toolpath_json`` and ``label``.

Raw .gcode files are NOT uploaded — only the parsed numerical toolpaths.

Phase 2 parsing strips all non-movement commands (temperatures, comments,
machine limits) and extracts absolute-coordinate toolpaths from G0/G1/G2/G3.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import time

TMP_DIR = "D:\\markeyTemp"
PARSED_TMP_DIR = "D:\\markeyTemp\\markeyTemp1"
RESULT_PREFIX = "___RESULT___:"

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
    tmp = tempfile.NamedTemporaryFile(
        dir=PARSED_TMP_DIR, suffix=".parsed", delete=False, mode="w"
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
    from concurrent.futures import ProcessPoolExecutor

    import huggingface_hub
    import pyarrow as pa
    import pyarrow.parquet as pq

    huggingface_hub.logging.set_verbosity_error()
    api = HfApi()

    # Flush a parquet shard every ~10GB of raw gcode (so a 20GB JS batch
    # produces ~2 commits instead of one giant one).
    UPLOAD_THRESHOLD = 10 * 1024 * 1024 * 1024  # 10 GB

    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(PARSED_TMP_DIR, exist_ok=True)
    staging_dir = tempfile.mkdtemp(dir=TMP_DIR, prefix="hf-stage-")
    data_staging = os.path.join(staging_dir, "data")
    os.makedirs(data_staging, exist_ok=True)

    # Determine starting shard number from existing parquet files on the repo
    try:
        existing_files = api.list_repo_files(REPO_ID, repo_type="dataset")
        shard_num = len([f for f in existing_files if f.startswith("data/") and f.endswith(".parquet")])
    except Exception as e:
        print(f"  WARN: list_repo_files failed: {e}", file=sys.stderr)
        shard_num = 0

    valid_entries: list[dict] = []
    skipped: list[dict] = []
    for entry in entries:
        file_path = entry["path"]
        if not os.path.exists(file_path):
            skipped.append({"file": file_path, "error": "not found"})
            continue
        valid_entries.append(entry)

    # Worker count is bounded; default to 4. Override via HF_PARSE_WORKERS env
    # var (set by the JS caller based on --concurrency) so we don't compete
    # with CuraEngine instances for RAM.
    try:
        num_workers = max(1, int(os.environ.get("HF_PARSE_WORKERS", "4")))
    except ValueError:
        num_workers = 4
    print(f"  Parsing {len(valid_entries)} files with {num_workers} workers...", file=sys.stderr)

    uploaded: list[str] = []
    failed: list[dict] = list(skipped)

    batch_parsed: list[str] = []   # .parsed temp file paths
    batch_labels: list[int] = []
    batch_originals: list[str] = []  # raw gcode source paths to delete after success
    batch_bytes = 0                # tracked raw gcode bytes

    def _upload_with_retry(folder: str, message: str, attempts: int = 3) -> None:
        last_err: Exception | None = None
        for i in range(attempts):
            try:
                api.upload_folder(
                    folder_path=folder,
                    repo_id=REPO_ID,
                    repo_type="dataset",
                    commit_message=message,
                )
                return
            except Exception as e:
                last_err = e
                wait = 15 * (i + 1)
                print(f"\n  upload attempt {i + 1}/{attempts} failed: {e}; retrying in {wait}s", file=sys.stderr)
                time.sleep(wait)
        assert last_err is not None
        raise last_err

    def flush_batch():
        nonlocal shard_num, batch_bytes
        if not batch_parsed:
            return
        shard_num += 1
        print(f"\n  Building Parquet shard {shard_num} from {len(batch_parsed)} files...", file=sys.stderr)

        schema = pa.schema([pa.field("toolpath_json", pa.string()), pa.field("label", pa.int64())])
        parquet_path = os.path.join(data_staging, f"batch_{shard_num:04d}.parquet")
        writer = pq.ParquetWriter(parquet_path, schema)

        # Stream rows in small chunks (~64MB JSON) to keep memory bounded.
        # Smaller chunks cost a bit of parquet write throughput but cap peak
        # RSS during flush — important when CuraEngine slicers are still
        # holding GBs in the parent JS process.
        CHUNK_BYTES = 64 * 1024 * 1024
        chunk_jsons: list[str] = []
        chunk_labels: list[int] = []
        chunk_bytes = 0

        for j, pf in enumerate(batch_parsed):
            try:
                with open(pf, "r") as f:
                    tj = f.read()
            except OSError as e:
                print(f"  WARN: parsed temp missing: {pf}: {e}", file=sys.stderr)
                continue
            try:
                os.unlink(pf)
            except OSError:
                pass
            chunk_jsons.append(tj)
            chunk_labels.append(batch_labels[j])
            chunk_bytes += len(tj)
            if chunk_bytes >= CHUNK_BYTES or j == len(batch_parsed) - 1:
                table = pa.table(
                    {"toolpath_json": chunk_jsons, "label": chunk_labels},
                    schema=schema,
                )
                writer.write_table(table)
                chunk_jsons.clear()
                chunk_labels.clear()
                chunk_bytes = 0

        writer.close()

        try:
            psize = os.path.getsize(parquet_path)
            print(f"  Parquet shard {shard_num} built ({psize / 1e9:.2f} GB). Uploading...", file=sys.stderr)
        except OSError:
            pass

        _upload_with_retry(
            folder=staging_dir,
            message=f"Upload batch {shard_num}: {len(batch_originals)} parsed gcode entries",
        )
        print(f"  Committed batch {shard_num}: data/batch_{shard_num:04d}.parquet ({len(batch_originals)} entries)", file=sys.stderr)

        # Remove the just-uploaded parquet so the next shard's upload_folder
        # doesn't try to re-push it.
        try:
            os.unlink(parquet_path)
        except OSError:
            pass

        # Delete the source .gcode files NOW, while we know this shard
        # committed successfully. If Python crashes during a later flush, these
        # files won't be re-queued and re-uploaded as duplicates on the next
        # run. JS still calls unlinkSync on them as a safety net.
        deleted = 0
        for fp in batch_originals:
            try:
                os.unlink(fp)
                deleted += 1
            except OSError:
                pass
        print(f"  Deleted {deleted}/{len(batch_originals)} local source files for shard {shard_num}", file=sys.stderr)

        # Emit a per-shard event on stdout so the JS caller can mark these
        # entries `uploaded: true` in augmented-manifest.json immediately,
        # without waiting for this Python process to exit.
        shard_payload = {"shard": shard_num, "uploaded": list(batch_originals)}
        print(f"___SHARD___:{json.dumps(shard_payload)}", flush=True)

        uploaded.extend(batch_originals)

        batch_parsed.clear()
        batch_labels.clear()
        batch_originals.clear()
        batch_bytes = 0

    import signal

    shutting_down = False

    def _signal_handler(signum, frame):
        nonlocal shutting_down
        if shutting_down:
            sys.stderr.write("\n  Force exit.\n")
            sys.exit(1)
        shutting_down = True
        sys.stderr.write("\n  Ctrl+C caught, shutting down gracefully (Ctrl+C again to force)...\n")

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    SUBMIT_BATCH = num_workers * 4

    with ProcessPoolExecutor(max_workers=num_workers) as pool:
        total = len(valid_entries)
        entry_idx = 0
        done_count = 0

        pending: dict = {}
        while entry_idx < total and len(pending) < SUBMIT_BATCH:
            e = valid_entries[entry_idx]
            pending[pool.submit(_parse_one, e["path"])] = e
            entry_idx += 1

        while pending and not shutting_down:
            done_futures = []
            for fut in list(pending.keys()):
                if fut.done():
                    done_futures.append(fut)

            if not done_futures:
                import concurrent.futures
                done_futures = [
                    concurrent.futures.wait(
                        pending, return_when=concurrent.futures.FIRST_COMPLETED
                    ).done.pop()
                ]

            for future in done_futures:
                entry = pending.pop(future)
                done_count += 1
                try:
                    result = future.result()
                    batch_parsed.append(result["parsed_path"])
                    batch_labels.append(entry["label"])

                    file_path = result["file_path"]
                    batch_originals.append(file_path)

                    try:
                        batch_bytes += os.path.getsize(file_path)
                    except OSError:
                        pass
                except Exception as e:
                    failed.append({"file": entry["path"], "error": str(e)})

                if entry_idx < total:
                    e = valid_entries[entry_idx]
                    pending[pool.submit(_parse_one, e["path"])] = e
                    entry_idx += 1

            sys.stderr.write(
                f"\r  Parsing: {done_count}/{total} ({done_count * 100 // total}%) batch: {batch_bytes / 1e9:.1f}/{UPLOAD_THRESHOLD / 1e9:.0f} GB"
            )
            sys.stderr.flush()

            if batch_bytes >= UPLOAD_THRESHOLD:
                flush_batch()

    flush_batch()

    if shutting_down:
        print(f"\n  Shutdown complete. Uploaded {len(uploaded)} files.", file=sys.stderr)
    else:
        print(f"\n  Total uploaded: {len(uploaded)}, failed: {len(failed)}", file=sys.stderr)

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
