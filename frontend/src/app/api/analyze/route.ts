import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { execFileSync } from "child_process";

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
  maxBuffer?: number;
};

const EXEC_MAX_BUFFER = 10 * 1024 * 1024;

type StepFailure = Error & {
  step?: string;
  code?: number | string;
  stdout?: string;
  stderr?: string;
  killed?: boolean;
  signal?: NodeJS.Signals;
};

const ANALYZE_DEBUG =
  process.env.ANALYZE_DEBUG?.trim().toLowerCase() === "1" ||
  process.env.ANALYZE_DEBUG?.trim().toLowerCase() === "true";

function logStep(sessionId: string, step: string, detail?: string) {
  const suffix = detail ? ` ${detail}` : "";
  console.log(`[analyze:${sessionId}] ${step}${suffix}`);
}

function logAnalyze(sessionId: string, step: string, detail?: string) {
  if (!ANALYZE_DEBUG) return;
  const suffix = detail ? ` ${detail}` : "";
  console.error(`[analyze:${sessionId}] ${step}${suffix}`);
}

function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

function trimOutput(text?: string, limit = 1200) {
  const value = text?.trim();
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...<truncated>`;
}

function createStepFailure(step: string, err: unknown): StepFailure {
  const error = (err instanceof Error ? err : new Error(String(err))) as StepFailure;
  error.step = step;
  return error;
}

async function runStep<T>(
  sessionId: string,
  step: string,
  startedAt: number,
  fn: () => Promise<T>
) {
  logStep(sessionId, `${step}:start`);
  logAnalyze(sessionId, `${step}:start`);
  try {
    const result = await fn();
    logStep(sessionId, `${step}:done`, `${elapsedMs(startedAt)}ms total`);
    logAnalyze(sessionId, `${step}:done`, `${elapsedMs(startedAt)}ms total`);
    return result;
  } catch (err) {
    const failure = createStepFailure(step, err);
    logStep(
      sessionId,
      `${step}:fail`,
      [
        `code=${String(failure.code ?? "unknown")}`,
        failure.killed ? "killed=true" : "",
        failure.signal ? `signal=${failure.signal}` : "",
        failure.message ? `message=${trimOutput(failure.message)}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    );
    logAnalyze(
      sessionId,
      `${step}:fail`,
      [
        `code=${String(failure.code ?? "unknown")}`,
        failure.killed ? "killed=true" : "",
        failure.signal ? `signal=${failure.signal}` : "",
        failure.stderr ? `stderr=${trimOutput(failure.stderr)}` : "",
        failure.stdout ? `stdout=${trimOutput(failure.stdout)}` : "",
        failure.message ? `message=${trimOutput(failure.message)}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    );
    throw failure;
  }
}

async function execPython(args: string[], options: ExecOptions = {}) {
  return exec(PYTHON_BIN, [...PYTHON_ARGS, ...args], {
    maxBuffer: EXEC_MAX_BUFFER,
    ...options,
  });
}

async function execConfiguredPython(
  configuredBin: string | undefined,
  args: string[],
  options: ExecOptions = {}
) {
  if (configuredBin) {
    return exec(configuredBin, args, {
      maxBuffer: EXEC_MAX_BUFFER,
      ...options,
    });
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
  const startedAt = Date.now();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const requestId = randomUUID();

  logStep(requestId, "request:received", `path=${req.nextUrl.pathname}`);

  if (!file) {
    logStep(requestId, "request:invalid", "missing file");
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    logStep(requestId, "request:invalid", `unsupported ext=${ext}`);
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Accepted: .stl, .obj, .glb` },
      { status: 400 }
    );
  }

  const sessionId = requestId;
  const tmpDir = join(tmpdir(), "markey", sessionId);
  const rendersDir = join(tmpDir, "renders");
  const inputStlPath = join(tmpDir, "slice-input.stl");
  const gcodePath = join(tmpDir, "output.gcode");

  const backendEnvPath = join(BACKEND_DIR, ".env");
  let backendEnv: NodeJS.ProcessEnv = { ...process.env };

  logStep(sessionId, "upload:accepted", `file=${file.name} ext=${ext} size=${file.size}`);

  try {
    logStep(sessionId, "env:load:start", backendEnvPath);
    const envDump = execFileSync(
      PYTHON_BIN,
      [
        ...PYTHON_ARGS,
        "-c",
        [
          "import json, sys",
          `sys.path.insert(0, r'${BACKEND_DIR.replace(/\\/g, "\\\\")}')`,
          "import classify_gcode_vast",
          "print(json.dumps({k: v for k, v in classify_gcode_vast.os.environ.items() if k.startswith('VAST_')}))",
        ].join("; "),
      ],
      {
        cwd: BACKEND_DIR,
        env: { ...process.env },
        encoding: "utf8",
      }
    );
    backendEnv = { ...backendEnv, ...(JSON.parse(envDump) as NodeJS.ProcessEnv) };
    logStep(sessionId, "env:load:done", "VAST_* loaded from backend/.env");
  } catch {
    logStep(sessionId, "env:load:warn", "could not preload backend/.env; using process env");
    logAnalyze(sessionId, "env:warn", `Could not preload VAST_* env from ${backendEnvPath}`);
  }

  try {
    logStep(sessionId, "pipeline:start");
    logAnalyze(sessionId, "start", `file=${file.name} ext=${ext}`);
    await mkdir(tmpDir, { recursive: true });
    logStep(sessionId, "workspace:tmp:ready", tmpDir);

    const inputPath = join(tmpDir, `input${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);
    logStep(sessionId, "upload:saved", inputPath);
    logAnalyze(sessionId, "uploaded", `tmp=${inputPath}`);

    await runStep(sessionId, "render", startedAt, () =>
      execPython([RENDER_SCRIPT, inputPath, rendersDir], {
        timeout: 180_000,
      })
    );
    logStep(sessionId, "render:outputs", rendersDir);

    await runStep(sessionId, "export-stl", startedAt, () =>
      execPython([EXPORT_STL_SCRIPT, inputPath, inputStlPath], {
        timeout: 60_000,
      })
    );
    logStep(sessionId, "export-stl:output", inputStlPath);

    await runStep(sessionId, "slice", startedAt, () =>
      exec(NODE_BIN, [CONVERT_SCRIPT, inputStlPath, gcodePath, DEF_FILE], {
        cwd: SLICER_DIR,
        timeout: 120_000,
        maxBuffer: EXEC_MAX_BUFFER,
      })
    );
    logStep(sessionId, "slice:output", gcodePath);

    const viewImages: Record<string, string> = {};
    for (const view of VIEWS) {
      const imgPath = join(rendersDir, `${view}.png`);
      const imgBuffer = await readFile(imgPath);
      viewImages[view] = `data:image/png;base64,${imgBuffer.toString("base64")}`;
      logStep(sessionId, "view:loaded", view);
    }
    logAnalyze(sessionId, "views:loaded", `${Object.keys(viewImages).length} views`);
    logStep(sessionId, "views:ready", `${Object.keys(viewImages).length} views`);

    const { stdout } = await runStep(sessionId, "vast-classify", startedAt, () =>
      execConfiguredPython(VAST_PYTHON_BIN, [VAST_CLASSIFY_SCRIPT, gcodePath], {
        cwd: BACKEND_DIR,
        env: { ...backendEnv, VAST_DEBUG: backendEnv.VAST_DEBUG ?? process.env.VAST_DEBUG ?? "1" },
        timeout: 600_000,
      })
    );
    logStep(sessionId, "vast-classify:stdout", `${stdout.trim().length} chars`);

    let classification: Record<string, unknown>;
    try {
      classification = parseJsonStdout(stdout);
      logStep(sessionId, "parse-json:done");
    } catch {
      classification = {
        label: "unknown",
        confidence: 0,
        verdict: "classification failed",
        summary: "Could not parse model response.",
        reasons: [],
        raw: stdout,
      };
      logStep(sessionId, "parse-json:warn", "fallback response used");
    }

    if (typeof classification.error === "string") {
      logStep(sessionId, "pipeline:fail", `classification error=${classification.error}`);
      throw new Error(classification.error);
    }

    logStep(sessionId, "pipeline:success", `${elapsedMs(startedAt)}ms total`);

    return NextResponse.json({
      views: viewImages,
      classification,
      filename: file.name,
      totalTimeMs: elapsedMs(startedAt),
    });
  } catch (err: unknown) {
    const failure = createStepFailure("unknown", err);
    const message = failure.message || String(err);
    const detail = [
      failure.step ? `step=${failure.step}` : "",
      failure.code ? `code=${String(failure.code)}` : "",
      failure.signal ? `signal=${failure.signal}` : "",
      failure.stderr ? `stderr=${trimOutput(failure.stderr)}` : "",
      failure.stdout ? `stdout=${trimOutput(failure.stdout)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    logStep(sessionId, "pipeline:error", `${message}${detail ? ` | ${detail}` : ""}`);
    logAnalyze(sessionId, "error", `${elapsedMs(startedAt)}ms total :: ${message}${detail ? ` | ${detail}` : ""}`);
    return NextResponse.json(
      {
        error: message,
        step: failure.step,
        code: failure.code,
        signal: failure.signal,
        stderr: trimOutput(failure.stderr),
        stdout: trimOutput(failure.stdout),
      },
      { status: 500 }
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    logStep(sessionId, "cleanup:done", `${elapsedMs(startedAt)}ms total`);
    logAnalyze(sessionId, "cleanup", `${elapsedMs(startedAt)}ms total`);
  }
}
