import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  buildFallbackInsights,
  extractJsonObject,
  normalizeInsights,
  type ClassificationLike,
} from "@/lib/demo-insights";

const MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured.", fallback: true },
      { status: 500 }
    );
  }

  let body: { classification?: ClassificationLike; filename?: string; views?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const classification = body.classification;
  if (!classification || typeof classification.label !== "string") {
    return NextResponse.json({ error: "Missing classification." }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename : "model";
  const views = body.views || {};

  const prompt = `You fill in DEMO dashboard JSON for a small research project (Markey) that classifies 3D mesh uploads.
The classifier already produced this result (authoritative for allowed vs restricted):

${JSON.stringify(classification, null, 2)}

File name: ${filename}

Look at the provided orthographic renderings of the 3D model. 
ONLY if the model confirms it is a restricted mechanical component (e.g. label is "restricted_mechanical_part" or "yes it's a gun"), you MUST explicitly state exactly what specific restricted component you visually identify it as in the analystNote. If it is allowed, do not guess what it is.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "policyOutcome": "BLOCK_EXPORT" | "ALLOW_EXPORT" | "MANUAL_REVIEW",
  "riskScore": number from 0-100,
  "alternateHypotheses": [ { "name": string, "probability": number 0-1 } ],
  "viewSalience": { "top": number, "bottom": number, "front": number, "back": number, "left": number, "right": number } each 0-1, sum approximately 1,
  "pipelineSteps": [ { "step": string, "durationMs": number } ] with 4-6 steps, plausible timings, total under 15000,
  "insightBullets": string[] length 3-5, plain factual tone, each under 120 characters,
  "exportBlocked": boolean,
  "exportGateLabel": string short,
  "analystNote": string one sentence, neutral technical wording
}

Rules:
- If label is "restricted_mechanical_part" or "yes it's a gun", use BLOCK_EXPORT or MANUAL_REVIEW and exportBlocked true unless you have strong reason for review only.
- If label is "allowed", use ALLOW_EXPORT and exportBlocked false.
- Hypotheses must be plausible alternatives (e.g. bracket vs receiver).
- Alternate hypotheses MUST NOT include the true item classification itself (e.g. if the item is a silencer, do not include 'silencer'; ONLY list ALTERNATIVE incorrect guesses).
- Stay consistent with the provided summary and reasons.
- In the analystNote, refer to the system as "Markey" instead of "Automated classification" or "The classifier".
- NEVER use the word "gun" in any of the output text. Always refer to it as a "firearm component" or "restricted mechanical component".
- When summarizing the classification result, explicitly state that it resulted in a "restricted mechanical component" or "accepted mechanical component".`;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    
    const imageParts = Object.values(views).map((base64Url: string) => {
      const match = base64Url.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) return null;
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }).filter(Boolean) as any[];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [prompt, ...imageParts],
    });

    const text = response.text;
    if (!text?.trim()) {
      throw new Error("Empty model response");
    }

    const raw = extractJsonObject(text) as Record<string, unknown>;
    const insights = normalizeInsights(raw, classification);
    return NextResponse.json({ insights, source: "gemini" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const insights = buildFallbackInsights(classification);
    return NextResponse.json({
      insights,
      source: "fallback",
      warning: message,
    });
  }
}
