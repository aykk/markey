"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import { DemoInsightsPanel } from "@/components/demo/DemoInsightsPanel";
import {
  buildFallbackInsights,
  type ClassificationLike,
  type DemoInsights,
} from "@/lib/demo-insights";

type Classification = {
  label: string;
  confidence: number;
  summary: string;
  reasons: string[];
  raw?: string;
};

type AnalysisResult = {
  views: Record<string, string>;
  classification: Classification;
  filename: string;
};

const ACCEPTED_EXTENSIONS = [".stl", ".obj", ".glb"];

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [insights, setInsights] = useState<DemoInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsSource, setInsightsSource] = useState<string | undefined>();
  const [insightsWarning, setInsightsWarning] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = useCallback((f: File) => {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      if (!isValidFile(f)) {
        setError(
          `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`
        );
        return;
      }
      setFile(f);
      setError(null);
      setResult(null);
      setInsights(null);
      setInsightsSource(undefined);
      setInsightsWarning(undefined);
    },
    [isValidFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => setDragActive(false), []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) handleFile(e.target.files[0]);
    },
    [handleFile]
  );

  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setInsightsLoading(false);
    setError(null);
    setResult(null);
    setInsights(null);
    setInsightsSource(undefined);
    setInsightsWarning(undefined);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        return;
      }

      setResult(data as AnalysisResult);
      setLoading(false);

      const c = data.classification as ClassificationLike;
      setInsightsLoading(true);
      try {
        const ir = await fetch("/api/demo-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classification: c,
            filename: data.filename,
          }),
        });
        const j = await ir.json();
        if (ir.ok && j.insights) {
          setInsights(j.insights as DemoInsights);
          setInsightsSource(j.source);
          setInsightsWarning(j.warning);
        } else {
          setInsights(buildFallbackInsights(c));
          setInsightsSource("fallback");
          setInsightsWarning(
            typeof j.error === "string" ? j.error : "Insights API unavailable"
          );
        }
      } catch {
        setInsights(buildFallbackInsights(c));
        setInsightsSource("fallback");
        setInsightsWarning("Could not reach insights service");
      } finally {
        setInsightsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setInsights(null);
    setInsightsSource(undefined);
    setInsightsWarning(undefined);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const isRestricted =
    result?.classification?.label === "restricted_mechanical_part";

  const showDashboard = Boolean(result && !loading);

  return (
    <main className="flex min-h-dvh flex-col bg-off-white">
      <nav className="flex shrink-0 items-center justify-between border-b border-charcoal/40 px-4 py-3 md:px-8">
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.2em] text-charcoal/70 hover:text-charcoal uppercase transition-colors md:text-xs"
        >
          ← Home
        </Link>
        <span className="font-mono text-[10px] tracking-[0.2em] text-charcoal uppercase md:text-xs">
          Demo
        </span>
      </nav>

      {!showDashboard ? (
        <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-12 md:py-16">
          <h1 className="font-mono text-2xl md:text-3xl tracking-[0.15em] text-charcoal uppercase mb-3">
            Analyze a 3D model
          </h1>
          <p className="text-charcoal/60 text-sm leading-relaxed mb-10 max-w-lg">
            Upload a 3D file. The pipeline renders six orthographic views,
            classifies the geometry, and enriches the result with policy
            analytics, charts, salience weighting, and export-gate status.
          </p>

          <div className="mb-8">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`
                border border-dashed cursor-pointer transition-colors
                flex flex-col items-center justify-center py-16 px-6
                ${
                  dragActive
                    ? "border-charcoal bg-charcoal/5"
                    : "border-charcoal/40 hover:border-charcoal/70"
                }
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".stl,.obj,.glb"
                onChange={onFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="text-center">
                  <p className="font-mono text-sm tracking-widest text-charcoal uppercase">
                    {file.name}
                  </p>
                  <p className="text-charcoal/50 text-xs mt-2">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-sm tracking-widest text-charcoal/60 uppercase">
                    Drop file here or click to browse
                  </p>
                  <p className="text-charcoal/40 text-xs mt-3">
                    Accepts {ACCEPTED_EXTENSIONS.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={analyze}
                disabled={!file || loading}
                className={`
                  font-mono text-xs tracking-[0.2em] uppercase px-6 py-3
                  border border-charcoal/40 transition-colors
                  ${
                    !file || loading
                      ? "text-charcoal/30 cursor-not-allowed"
                      : "text-off-white bg-black hover:bg-black/80"
                  }
                `}
              >
                {loading ? "Analyzing…" : "Run analysis"}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={reset}
                  className="font-mono text-xs tracking-[0.2em] uppercase px-6 py-3 border border-charcoal/40 text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {error && (
              <p className="mt-4 font-mono text-xs text-red-600 tracking-wide">
                {error}
              </p>
            )}
          </div>

          {loading && (
            <div className="border border-charcoal/40 p-8">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 border border-charcoal/40 animate-spin border-t-charcoal" />
                <p className="font-mono text-xs tracking-widest text-charcoal/60 uppercase">
                  Rendering views and classifying…
                </p>
              </div>
              <p className="text-charcoal/40 text-xs mt-3">
                This may take up to 30 seconds.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full px-4 py-6 md:px-8 md:py-10">
          <div
            className={`mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4 border border-charcoal/40 px-4 py-4 md:px-6 ${
              isRestricted
                ? "border-red-500/40 bg-red-500/5"
                : "border-green-700/40 bg-green-700/5"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs tracking-wide text-charcoal/55 uppercase">
                {result!.filename}
              </p>
              <p className="font-mono text-sm text-charcoal mt-1 uppercase tracking-wide">
                {result!.classification.label.replace(/_/g, " ")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {insightsLoading && (
                <span className="font-mono text-xs tracking-widest text-charcoal/50 uppercase animate-pulse">
                  Collecting insights…
                </span>
              )}
              <button
                type="button"
                onClick={reset}
                className="font-mono text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-charcoal/40 text-charcoal hover:bg-charcoal/5"
              >
                New file
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-6xl">
            {insights && (
              <DemoInsightsPanel
                insights={insights}
                classification={result!.classification}
                views={result!.views}
                source={insightsSource}
                warning={insightsWarning}
              />
            )}
            {insightsLoading && !insights && (
              <div className="flex min-h-[40vh] items-center justify-center border border-charcoal/40 p-12">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 border-2 border-charcoal/30 animate-spin border-t-charcoal" />
                  <p className="font-mono text-sm tracking-widest text-charcoal/55 uppercase">
                    Building dashboard…
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
