"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";

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
    setError(null);
    setResult(null);

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

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const isRestricted =
    result?.classification?.label === "restricted_mechanical_part";

  return (
    <main className="min-h-dvh bg-off-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-charcoal/40">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.2em] text-charcoal/70 hover:text-charcoal uppercase transition-colors"
        >
          ← Home
        </Link>
        <span className="font-mono text-xs tracking-[0.2em] text-charcoal uppercase">
          Demo
        </span>
      </nav>

      <div className="px-6 md:px-12 py-12 md:py-20 max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="font-mono text-2xl md:text-3xl tracking-[0.15em] text-charcoal uppercase mb-3">
          Analyze a 3D model
        </h1>
        <p className="text-charcoal/60 text-sm leading-relaxed mb-10 max-w-lg">
          Upload a 3D file to classify it using Markey&apos;s ML pipeline. The
          model is rendered from six orthographic views and analyzed by Gemini
          Vision.
        </p>

        {/* Upload zone */}
        {!result && (
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
                  <p className="font-mono text-sm tracking-[0.1em] text-charcoal uppercase">
                    {file.name}
                  </p>
                  <p className="text-charcoal/50 text-xs mt-2">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-sm tracking-[0.1em] text-charcoal/60 uppercase">
                    Drop file here or click to browse
                  </p>
                  <p className="text-charcoal/40 text-xs mt-3">
                    Accepts {ACCEPTED_EXTENSIONS.join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
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
        )}

        {/* Loading state */}
        {loading && (
          <div className="border border-charcoal/40 p-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 border border-charcoal/40 animate-spin" />
              <p className="font-mono text-xs tracking-[0.1em] text-charcoal/60 uppercase">
                Rendering views and classifying…
              </p>
            </div>
            <p className="text-charcoal/40 text-xs mt-3">
              This may take up to 30 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Classification banner */}
            <div
              className={`border p-6 mb-8 ${
                isRestricted
                  ? "border-red-500 bg-red-500/5"
                  : "border-green-600 bg-green-600/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-2">
                    Classification
                  </p>
                  <p
                    className={`font-mono text-lg tracking-[0.1em] uppercase ${
                      isRestricted ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {isRestricted ? (
                      <><span className="text-red-600 font-bold">✕</span> Restricted</>
                    ) : (
                      <><span className="text-green-700 font-bold">✓</span> Allowed</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-2">
                    Confidence
                  </p>
                  <p className="font-mono text-lg text-charcoal">
                    {(result.classification.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <p className="text-charcoal/70 text-sm mt-4 leading-relaxed">
                {result.classification.summary}
              </p>

              {result.classification.reasons?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {result.classification.reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-charcoal/60 text-xs pl-4"
                      style={{ listStyleType: "square" }}
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 6 Views grid */}
            <div className="mb-8">
              <p className="font-mono text-xs tracking-[0.2em] text-charcoal/50 uppercase mb-4">
                Orthographic views , {result.filename}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-charcoal/40">
                {["front", "back", "left", "right", "top", "bottom"].map(
                  (view) => (
                    <div key={view} className="bg-white p-2">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-charcoal/40 uppercase mb-2">
                        {view}
                      </p>
                      {result.views[view] ? (
                        <img
                          src={result.views[view]}
                          alt={`${view} view`}
                          className="w-full aspect-square object-contain"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-charcoal/5 flex items-center justify-center text-charcoal/30 text-xs">
                          N/A
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={reset}
              className="font-mono text-xs tracking-[0.2em] uppercase px-6 py-3 border border-charcoal/40 text-charcoal/60 hover:text-charcoal transition-colors"
            >
              Analyze another file
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
