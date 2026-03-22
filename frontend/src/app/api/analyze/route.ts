import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const exec = promisify(execFile);

const BACKEND_DIR = join(process.cwd(), "..", "backend");
const PYTHON = "python3";

const VIEWS = ["top", "bottom", "front", "back", "left", "right"] as const;
const ALLOWED_EXTENSIONS = new Set([".stl", ".obj", ".glb"]);

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

  try {
    await mkdir(tmpDir, { recursive: true });

    const inputPath = join(tmpDir, `input${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    await exec(PYTHON, [join(BACKEND_DIR, "render_stl_views.py"), inputPath, rendersDir], {
      timeout: 60_000,
    });

    const viewImages: Record<string, string> = {};
    for (const view of VIEWS) {
      const imgPath = join(rendersDir, `${view}.png`);
      const imgBuffer = await readFile(imgPath);
      viewImages[view] = `data:image/png;base64,${imgBuffer.toString("base64")}`;
    }

    const { stdout } = await exec(
      PYTHON,
      [join(BACKEND_DIR, "gemini.py"), rendersDir],
      {
        cwd: BACKEND_DIR,
        env: { ...process.env, GEMINI_API_KEY: geminiKey },
        timeout: 120_000,
      }
    );

    let classification;
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object in output");
      classification = JSON.parse(jsonMatch[0]);
    } catch {
      classification = {
        label: "unknown",
        confidence: 0,
        summary: "Could not parse model response.",
        reasons: [],
        raw: stdout,
      };
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
