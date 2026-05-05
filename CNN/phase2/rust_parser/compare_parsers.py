"""Sanity-check: parse the same G-code file with both backends and compare.

Compares row count, element-wise type/coords (parsed JSON), and timings.
"""
from __future__ import annotations

import json
import os
import sys
import time
import importlib.util

import markey_gcode_parser as rust_parser

PYTHON_PARSER_PATH = os.path.join(
    os.path.dirname(__file__), "..", "parse_gcode.py"
)
spec = importlib.util.spec_from_file_location("phase2_parse_gcode", PYTHON_PARSER_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

if len(sys.argv) < 2:
    print("Usage: compare_parsers.py <file.gcode>")
    sys.exit(1)

src = sys.argv[1]
out_py = src + ".py.parsed"
out_rs = src + ".rs.parsed"

t0 = time.perf_counter()
n_py = mod.write_parsed_gcode_json(src, out_py)
t_py = time.perf_counter() - t0

t0 = time.perf_counter()
n_rs = rust_parser.write_parsed_gcode_json(src, out_rs)
t_rs = time.perf_counter() - t0

py_size = os.path.getsize(out_py)
rs_size = os.path.getsize(out_rs)

with open(out_py) as f:
    py_rows = json.load(f)
with open(out_rs) as f:
    rs_rows = json.load(f)

print(f"  Python: {n_py} rows  {t_py*1000:.1f} ms  {py_size/1e6:.2f} MB")
print(f"  Rust:   {n_rs} rows  {t_rs*1000:.1f} ms  {rs_size/1e6:.2f} MB")
print(f"  Speedup: {t_py / max(t_rs, 1e-9):.2f}x")

assert n_py == n_rs, f"row count mismatch: {n_py} vs {n_rs}"
assert len(py_rows) == len(rs_rows), "row list length mismatch"

mismatches = 0
for i, (a, b) in enumerate(zip(py_rows, rs_rows)):
    if a.keys() != b.keys():
        if mismatches < 5:
            print(f"  KEYS DIFFER row {i}: py={sorted(a)} rs={sorted(b)}")
        mismatches += 1
        continue
    for k in a:
        va, vb = a[k], b[k]
        if isinstance(va, float) and isinstance(vb, float):
            if abs(va - vb) > 1e-9:
                if mismatches < 5:
                    print(f"  FLOAT DIFFER row {i} key {k}: py={va} rs={vb}")
                mismatches += 1
                break
        elif va != vb:
            if mismatches < 5:
                print(f"  VAL DIFFER row {i} key {k}: py={va} rs={vb}")
            mismatches += 1
            break

if mismatches == 0:
    print("  Semantic equality OK (all rows match)")
else:
    print(f"  Mismatches: {mismatches}")

os.unlink(out_py)
os.unlink(out_rs)
