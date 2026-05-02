"""Phase 2: G-Code Parsing and Filtering.

Parses raw G-code into a cleaned numerical representation:
  - Tracks state modifiers: G90/G91 (abs/rel coords), M82/M83 (abs/rel extrusion), G92 (reset)
  - Extracts geometric toolpaths from G0, G1, G2, G3 commands
  - Retains G0 travel moves
  - Purges comments, temperatures, fan speeds, machine limits, and all other non-movement lines

Output format: a list of dicts, one per movement command:
  {
    "type": "G0"|"G1"|"G2"|"G3",
    "X": float, "Y": float, "Z": float, "E": float,
    "I": float, "J": float  (arc center offsets, G2/G3 only)
  }
Coordinates are always returned in **absolute** form regardless of the source
G-code's G90/G91 mode.  Extrusion values are similarly normalised to absolute.
"""
from __future__ import annotations

import math
import re
import sys
from typing import List, Optional


class GCodeParser:
    """Stateful G-code parser that extracts geometric toolpaths."""

    _RE_LINE = re.compile(
        r"^(G[0-3]|G90|G91|G92|M82|M83)\b"
        r"(?:\s+([XYZEIJF][+-]?\d*\.?\d+))*"
    )
    _RE_PARAM = re.compile(r"([XYZEIJF])([+-]?\d*\.?\d+)")

    def __init__(self) -> None:
        self.x: float = 0.0
        self.y: float = 0.0
        self.z: float = 0.0
        self.e: float = 0.0
        self.absolute_coords: bool = True
        self.absolute_extrusion: bool = True

    def _apply_params(self, params: dict) -> dict:
        """Resolve params to absolute coordinates given current state."""
        if self.absolute_coords:
            x = params.get("X", self.x)
            y = params.get("Y", self.y)
            z = params.get("Z", self.z)
        else:
            x = self.x + params.get("X", 0.0)
            y = self.y + params.get("Y", 0.0)
            z = self.z + params.get("Z", 0.0)

        if self.absolute_extrusion:
            e_val = params.get("E", self.e)
        else:
            e_val = self.e + params.get("E", 0.0)

        self.x, self.y, self.z, self.e = x, y, z, e_val

        result = {"X": x, "Y": y, "Z": z, "E": e_val}
        if "I" in params:
            result["I"] = params["I"]
        if "J" in params:
            result["J"] = params["J"]
        return result

    def parse_line(self, line: str) -> Optional[dict]:
        """Parse a single G-code line. Returns a toolpath dict or None."""
        # Strip comments
        line = line.split(";")[0].strip()
        if not line:
            return None

        # Extract command word (first token)
        parts = line.split()
        if not parts:
            return None
        cmd = parts[0].upper()

        # State modifiers
        if cmd == "G90":
            self.absolute_coords = True
            return None
        if cmd == "G91":
            self.absolute_coords = False
            return None
        if cmd == "M82":
            self.absolute_extrusion = True
            return None
        if cmd == "M83":
            self.absolute_extrusion = False
            return None
        if cmd == "G92":
            params = self._parse_params(line)
            if "X" in params:
                self.x = params["X"]
            if "Y" in params:
                self.y = params["Y"]
            if "Z" in params:
                self.z = params["Z"]
            if "E" in params:
                self.e = params["E"]
            return None

        # Movement commands
        if cmd in ("G0", "G1", "G2", "G3"):
            params = self._parse_params(line)
            resolved = self._apply_params(params)
            resolved["type"] = cmd
            return resolved

        return None

    @staticmethod
    def _parse_params(line: str) -> dict:
        """Extract X/Y/Z/E/I/J/F parameters from a G-code line."""
        params = {}
        for m in re.finditer(r"([XYZEIJF])([+-]?\d*\.?\d+)", line):
            params[m.group(1)] = float(m.group(2))
        return params


def parse_gcode(text: str) -> List[dict]:
    """Parse a full G-code string into a list of toolpath dicts."""
    parser = GCodeParser()
    toolpaths: List[dict] = []
    for line in text.splitlines():
        result = parser.parse_line(line)
        if result is not None:
            toolpaths.append(result)
    return toolpaths


def toolpaths_to_rows(toolpaths: List[dict]) -> List[dict]:
    """Convert absolute toolpaths into compact serialisable rows.

    Each row contains the movement type and the resolved absolute coordinates.
    Arc offsets (I, J) are included for G2/G3. Fields absent from the original
    command inherit the previous value, so every row is self-contained.
    """
    rows: List[dict] = []
    prev = {"X": 0.0, "Y": 0.0, "Z": 0.0, "E": 0.0}
    for tp in toolpaths:
        row = {
            "type": tp["type"],
            "X": tp["X"],
            "Y": tp["Y"],
            "Z": tp["Z"],
            "E": tp["E"],
        }
        if "I" in tp:
            row["I"] = tp["I"]
        if "J" in tp:
            row["J"] = tp["J"]
        prev = {"X": row["X"], "Y": row["Y"], "Z": row["Z"], "E": row["E"]}
        rows.append(row)
    return rows


def parse_gcode_file(path: str) -> List[dict]:
    """Read a .gcode file and return parsed toolpath rows."""
    with open(path, "r", errors="ignore") as f:
        text = f.read()
    toolpaths = parse_gcode(text)
    return toolpaths


if __name__ == "__main__":
    import json

    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        print("Usage: parse_gcode.py <file.gcode>", file=sys.stderr)
        sys.exit(1)

    toolpaths = parse_gcode_file(path)
    rows = toolpaths_to_rows(toolpaths)
    print(json.dumps(rows, indent=2))
