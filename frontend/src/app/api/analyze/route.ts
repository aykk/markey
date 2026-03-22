import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const exec = promisify(execFile);

export const runtime = "nodejs";

const BACKEND_DIR = join(process.cwd(), "..", "backend");
const SLICER_DIR = join(process.cwd(), "..", "slicer");
const RENDER_SCRIPT = join(BACKEND_DIR, "render_stl_views.py");
const EXPORT_STL_SCRIPT = join(BACKEND_DIR, "export_mesh_stl.py");
const VAST_CLASSIFY_SCRIPT = join(BACKEND_DIR, "classify_gcode_vast.py");
const CONVERT_SCRIPT = join(SLICER_DIR, "convert.js");
const DEF_FILE = join(SLICER_DIR, "fdmprinter.def.json");
const NODE_BIN = process.execPath;
const PYTHON_BIN = process.platform === "win32" ? "py" : "python3";
const PYTHON_ARGS = process.platform === "win32" ? ["-3"] : [];
const VAST_PYTHON_BIN = process.env.VAST_PYTHON_BIN?.trim();

const VIEWS = ["top", "bottom", "front", "back", "left", "right"] as const;
const ALLOWED_EXTENSIONS = new Set([".stl", ".obj", ".glb"]);

type ExecOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
};

async function execPython(args: string[], options: ExecOptions = {}) {
  return exec(PYTHON_BIN, [...PYTHON_ARGS, ...args], options);
}

async function execConfiguredPython(
  configuredBin: string | undefined,
  args: string[],
  options: ExecOptions = {}
) {
  if (configuredBin) {
    return exec(configuredBin, args, options);
  }

  return execPython(args, options);
}

function parseJsonStdout(stdout: string) {
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object in model output");
    }
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Accepted: .stl, .obj, .glb` },
      { status: 400 }
    );
  }

  const sessionId = randomUUID();
  const tmpDir = join(tmpdir(), "markey", sessionId);
  const rendersDir = join(tmpDir, "renders");
  const inputStlPath = join(tmpDir, "slice-input.stl");
  const gcodePath = join(tmpDir, "output.gcode");

  try {
    await mkdir(tmpDir, { recursive: true });

    const inputPath = join(tmpDir, `input${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    await execPython([RENDER_SCRIPT, inputPath, rendersDir], {
      timeout: 60_000,
    });

    await execPython([EXPORT_STL_SCRIPT, inputPath, inputStlPath], {
      timeout: 60_000,
    });

    await exec(NODE_BIN, [CONVERT_SCRIPT, inputStlPath, gcodePath, DEF_FILE], {
      cwd: SLICER_DIR,
      timeout: 120_000,
    });

    const viewImages: Record<string, string> = {};
    for (const view of VIEWS) {
      const imgPath = join(rendersDir, `${view}.png`);
      const imgBuffer = await readFile(imgPath);
      viewImages[view] = `data:image/png;base64,${imgBuffer.toString("base64")}`;
    }

    const { stdout } = await execConfiguredPython(VAST_PYTHON_BIN, [
      VAST_CLASSIFY_SCRIPT,
      gcodePath,
    ], {
      cwd: BACKEND_DIR,
      timeout: 600_000,
    });

    let classification: Record<string, unknown>;
    try {
      classification = parseJsonStdout(stdout);
    } catch {
      classification = {
        label: "unknown",
        confidence: 0,
        verdict: "classification failed",
        summary: "Could not parse model response.",
        reasons: [],
        raw: stdout,
      };
    }

    if (typeof classification.error === "string") {
      throw new Error(classification.error);
    }

    return NextResponse.json({
      views: viewImages,
      classification,
      filename: file.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
