/** Demo dashboard payload from classification (vision + policy-shaped fields). */

export type PolicyOutcome = "BLOCK_EXPORT" | "ALLOW_EXPORT" | "MANUAL_REVIEW";

export type DemoInsights = {
  policyOutcome: PolicyOutcome;
  riskScore: number;
  alternateHypotheses: { name: string; probability: number }[];
  viewSalience: Record<string, number>;
  pipelineSteps: { step: string; durationMs: number }[];
  insightBullets: string[];
  exportBlocked: boolean;
  exportGateLabel: string;
  analystNote: string;
};

export type ClassificationLike = {
  label: string;
  confidence: number;
  summary: string;
  reasons: string[];
};

const VIEW_KEYS = ["front", "back", "left", "right", "top", "bottom"] as const;

export function extractJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in response");
  return JSON.parse(match[0]);
}

function normalizeSalience(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  let sum = 0;
  for (const k of VIEW_KEYS) {
    const v = Number(raw[k]);
    if (Number.isFinite(v) && v >= 0) {
      out[k] = v;
      sum += v;
    }
  }
  if (sum <= 0) {
    const u = 1 / VIEW_KEYS.length;
    for (const k of VIEW_KEYS) out[k] = u;
    return out;
  }
  for (const k of VIEW_KEYS) out[k] = (out[k] ?? 0) / sum;
  return out;
}

export function normalizeInsights(partial: Record<string, unknown>, c: ClassificationLike): DemoInsights {
  const restricted = c.label === "restricted_mechanical_part";
  const allowed = c.label === "allowed";
  const policy = partial.policyOutcome as string;
  let policyOutcome: PolicyOutcome = "MANUAL_REVIEW";
  if (policy === "BLOCK_EXPORT" || policy === "ALLOW_EXPORT" || policy === "MANUAL_REVIEW") {
    policyOutcome = policy;
  } else if (restricted) policyOutcome = "BLOCK_EXPORT";
  else if (allowed) policyOutcome = "ALLOW_EXPORT";

  const risk = Math.min(100, Math.max(0, Number(partial.riskScore) || (restricted ? 75 : 25)));

  const hypsRaw = Array.isArray(partial.alternateHypotheses) ? partial.alternateHypotheses : [];
  const alternateHypotheses = hypsRaw
    .map((h) => {
      const o = h as Record<string, unknown>;
      return {
        name: String(o.name ?? "Unknown"),
        probability: Math.min(1, Math.max(0, Number(o.probability) || 0)),
      };
    })
    .filter((h) => h.name.length > 0)
    .slice(0, 5);

  const stepsRaw = Array.isArray(partial.pipelineSteps) ? partial.pipelineSteps : [];
  const pipelineSteps = stepsRaw
    .map((s) => {
      const o = s as Record<string, unknown>;
      return {
        step: String(o.step ?? "Step"),
        durationMs: Math.min(30_000, Math.max(0, Number(o.durationMs) || 0)),
      };
    })
    .slice(0, 6);

  const bulletsRaw = Array.isArray(partial.insightBullets) ? partial.insightBullets : [];
  const insightBullets = bulletsRaw.map((b) => String(b)).filter(Boolean).slice(0, 6);

  const viewSalience = normalizeSalience((partial.viewSalience as Record<string, unknown>) ?? {});

  const exportBlocked =
    typeof partial.exportBlocked === "boolean"
      ? partial.exportBlocked
      : policyOutcome === "BLOCK_EXPORT" || policyOutcome === "MANUAL_REVIEW";

  const exportGateLabel =
    String(partial.exportGateLabel || "") ||
    (exportBlocked ? "G-code export blocked" : "G-code export permitted");

  const analystNote = String(partial.analystNote || c.summary || "").slice(0, 400);

  return {
    policyOutcome,
    riskScore: risk,
    alternateHypotheses: alternateHypotheses.length
      ? alternateHypotheses
      : buildFallbackInsights(c).alternateHypotheses,
    viewSalience,
    pipelineSteps: pipelineSteps.length ? pipelineSteps : buildFallbackInsights(c).pipelineSteps,
    insightBullets: insightBullets.length ? insightBullets : buildFallbackInsights(c).insightBullets,
    exportBlocked,
    exportGateLabel,
    analystNote,
  };
}

export function buildFallbackInsights(c: ClassificationLike): DemoInsights {
  const restricted = c.label === "restricted_mechanical_part";
  const conf = Math.min(1, Math.max(0, Number(c.confidence) || 0));

  return {
    policyOutcome: restricted ? "BLOCK_EXPORT" : c.label === "allowed" ? "ALLOW_EXPORT" : "MANUAL_REVIEW",
    riskScore: restricted ? Math.round(55 + conf * 40) : Math.round((1 - conf) * 35),
    alternateHypotheses: restricted
      ? [
          { name: "Receiver / frame-like geometry", probability: 0.68 },
          { name: "Bracket or mount (ambiguous)", probability: 0.19 },
          { name: "Toy or prop geometry", probability: 0.13 },
        ]
      : [
          { name: "Benign mechanical part", probability: 0.74 },
          { name: "Ambiguous industrial shape", probability: 0.18 },
          { name: "Other", probability: 0.08 },
        ],
    viewSalience: {
      front: 0.26,
      right: 0.22,
      top: 0.18,
      left: 0.14,
      back: 0.12,
      bottom: 0.08,
    },
    pipelineSteps: [
      { step: "Ingest mesh", durationMs: 120 },
      { step: "Normalize & render 6 views", durationMs: 2100 },
      { step: "Vision encode", durationMs: 890 },
      { step: "Policy + classifier", durationMs: 640 },
      { step: "Audit log", durationMs: 45 },
    ],
    insightBullets:
      c.reasons?.length > 0
        ? c.reasons.slice(0, 5)
        : [c.summary || "Analysis complete. Review orthographic views for geometry cues."],
    exportBlocked: restricted || c.label === "unknown",
    exportGateLabel: restricted ? "G-code export blocked by policy" : "G-code export permitted",
    analystNote: c.summary || "Heuristic audit complete.",
  };
}
