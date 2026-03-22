"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClassificationLike, DemoInsights } from "@/lib/demo-insights";

const VIEW_ORDER = ["front", "back", "left", "right", "top", "bottom"] as const;

function policyPresentation(o: DemoInsights["policyOutcome"]) {
  switch (o) {
    case "BLOCK_EXPORT":
      return {
        word: "Restricted",
        sub: "Export denied",
        tone: "red" as const,
        icon: "✕" as const,
      };
    case "ALLOW_EXPORT":
      return {
        word: "Accepted",
        sub: "Export permitted",
        tone: "green" as const,
        icon: "✓" as const,
      };
    default:
      return {
        word: "Review",
        sub: "Manual review queue",
        tone: "amber" as const,
        icon: "!" as const,
      };
  }
}

function toneBorder(t: "red" | "green" | "amber") {
  if (t === "red") return "border-red-600 bg-red-600/[0.06]";
  if (t === "green") return "border-green-700 bg-green-700/[0.06]";
  return "border-amber-600 bg-amber-600/[0.08]";
}

function toneText(t: "red" | "green" | "amber") {
  if (t === "red") return "text-red-600";
  if (t === "green") return "text-green-800";
  return "text-amber-800";
}

const sectionTitle =
  "font-mono text-xs tracking-[0.2em] text-charcoal/55 uppercase mb-4";

type Props = {
  insights: DemoInsights;
  classification: ClassificationLike;
  views: Record<string, string>;
  source?: string;
  warning?: string;
  className?: string;
};

export function DemoInsightsPanel({
  insights,
  classification,
  views,
  source,
  warning,
  className = "",
}: Props) {
  const policy = policyPresentation(insights.policyOutcome);
  const confPct = Math.round(
    Math.min(1, Math.max(0, classification.confidence)) * 100
  );

  const hypoData = insights.alternateHypotheses.map((h) => ({
    name: h.name.length > 42 ? `${h.name.slice(0, 40)}…` : h.name,
    probability: h.probability,
  }));

  const salienceData = VIEW_ORDER.map((k) => ({
    view: k,
    weight: Math.round((insights.viewSalience[k] ?? 0) * 100),
  }));

  const totalMs = insights.pipelineSteps.reduce((a, s) => a + s.durationMs, 0);

  return (
    <div className={`mx-auto w-full max-w-6xl space-y-10 pb-16 ${className}`}>
      {(warning || source) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-charcoal/20 pb-4 font-mono text-xs text-charcoal/60">
          {source && (
            <span className="tracking-wide uppercase">
              Generated copy:{" "}
              <span className="text-charcoal">
                {source === "gemini"
                  ? "Gemini 2.5 Flash"
                  : "Structured policy layer"}
              </span>
            </span>
          )}
          {warning && (
            <span className="text-amber-800">{warning}</span>
          )}
        </div>
      )}

      {/* 1, Verdict & policy */}
      <section>
        <h2 className={sectionTitle}>Verdict (demo)</h2>
        <div
          className={`border-2 px-6 py-8 md:px-10 md:py-10 ${toneBorder(policy.tone)}`}
        >
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-charcoal/50 uppercase mb-2">
              Demo outcome
            </p>
            <p
              className={`font-mono text-4xl md:text-5xl tracking-tight uppercase ${toneText(policy.tone)} flex items-baseline gap-3`}
            >
              <span className="font-bold leading-none">{policy.icon}</span>
              <span>{policy.word}</span>
            </p>
            <p className="font-mono text-sm tracking-wide text-charcoal/65 uppercase mt-2">
              {policy.sub}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-charcoal/80">
              {insights.analystNote}
            </p>
            <p className="mt-6 border-t border-charcoal/15 pt-6 font-mono text-sm uppercase tracking-wide text-charcoal/70">
              {insights.exportGateLabel}
            </p>
          </div>
        </div>
      </section>

      {/* 2, Risk & confidence */}
      <section>
        <h2 className={sectionTitle}>Scores</h2>
        <div className="grid gap-px bg-charcoal/40 md:grid-cols-2">
          <div className="bg-off-white p-8">
            <p className="font-mono text-xs tracking-[0.15em] text-charcoal/50 uppercase mb-4">
              Risk index
            </p>
            <div className="h-4 w-full border border-charcoal/30 bg-charcoal/5">
              <div
                className="h-full bg-charcoal transition-[width] duration-700 ease-out"
                style={{ width: `${insights.riskScore}%` }}
              />
            </div>
            <p className="font-mono text-3xl text-charcoal mt-4">
              {insights.riskScore}
              <span className="text-lg text-charcoal/45">/100</span>
            </p>
          </div>
          <div className="bg-off-white p-8">
            <p className="font-mono text-xs tracking-[0.15em] text-charcoal/50 uppercase mb-4">
              Classifier confidence
            </p>
            <div className="h-4 w-full border border-charcoal/30 bg-charcoal/5">
              <div
                className={`h-full transition-[width] duration-700 ease-out ${
                  classification.label === "restricted_mechanical_part"
                    ? "bg-red-500/85"
                    : "bg-green-700/85"
                }`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            <p className="font-mono text-3xl text-charcoal mt-4">{confPct}%</p>
          </div>
        </div>
      </section>

      {/* 3, Charts */}
      <section>
        <h2 className={sectionTitle}>Model output</h2>
        <div className="space-y-8">
          <div className="border border-charcoal/40 bg-off-white p-6 md:p-8">
            <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-6">
              Alternate hypotheses
            </p>
            <div className="h-[260px] w-full md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={hypoData}
                  margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={168}
                    tick={{ fontSize: 12, fill: "#36454f" }}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `${(Number(v) * 100).toFixed(1)}%`,
                      "Probability",
                    ]}
                    contentStyle={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      border: "1px solid rgba(54,69,79,0.35)",
                    }}
                  />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={22}>
                    {hypoData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0 ? "#36454f" : i === 1 ? "#64748b" : "#94a3b8"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-charcoal/40 bg-off-white p-6 md:p-8">
            <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-6">
              View salience (estimated)
            </p>
            <div className="h-56 w-full md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salienceData} margin={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <XAxis
                    dataKey="view"
                    tick={{ fontSize: 12, fill: "#36454f" }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    width={36}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v) => [`${Number(v)}%`, "Weight"]}
                    contentStyle={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      border: "1px solid rgba(54,69,79,0.35)",
                    }}
                  />
                  <Bar dataKey="weight" fill="#36454f" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* 4, Views */}
      <section>
        <h2 className={sectionTitle}>Orthographic renderings</h2>
        <div className="grid grid-cols-2 gap-2 border border-charcoal/40 bg-charcoal/40 p-2 md:grid-cols-3 md:gap-px md:p-px">
          {VIEW_ORDER.map((view) => {
            const w = insights.viewSalience[view] ?? 0;
            const thick = w > 0.2 ? 4 : w > 0.12 ? 2 : 1;
            return (
              <div
                key={view}
                className="flex flex-col bg-white p-3 md:p-4"
              >
                <p className="font-mono text-xs tracking-[0.15em] text-charcoal/50 uppercase mb-3">
                  {view}{" "}
                  <span className="text-charcoal/75">
                    {Math.round(w * 100)}%
                  </span>
                </p>
                <div
                  className="rounded-sm"
                  style={{
                    boxShadow: `0 0 0 ${thick}px rgba(54,69,79,${0.22 + w * 0.4})`,
                  }}
                >
                  {views[view] ? (
                    <img
                      src={views[view]}
                      alt={`${view} view`}
                      className="aspect-square w-full object-contain bg-black/5"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-charcoal/5 text-sm text-charcoal/35">
                      N/A
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5, Pipeline & insights */}
      <section>
        <h2 className={sectionTitle}>Trace and notes</h2>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="border border-charcoal/40 p-6 lg:col-span-5">
            <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-4">
              Pipeline (~{(totalMs / 1000).toFixed(2)}s total)
            </p>
            <div className="space-y-3">
              {insights.pipelineSteps.map((s, i) => (
                <div
                  key={`${s.step}-${i}`}
                  className="demo-rise flex items-start gap-3 border border-charcoal/30 bg-off-white px-4 py-3"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="font-mono text-xs text-green-700 shrink-0">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-charcoal/45 uppercase tracking-wide">
                      {s.durationMs} ms
                    </p>
                    <p className="text-sm leading-snug text-charcoal/85 mt-1">
                      {s.step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-charcoal/40 bg-black p-6 text-off-white lg:col-span-7">
            <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase mb-5">
              Notes
            </p>
            <ul className="space-y-4">
              {insights.insightBullets.map((b, i) => (
                <li
                  key={i}
                  className="demo-rise border-l-2 border-white/25 pl-4 text-sm leading-relaxed text-off-white/90"
                  style={{ animationDelay: `${100 + i * 70}ms` }}
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
