"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import type { AuditReport } from "@/lib/types";
import beforeFixture from "@/fixtures/usx-before.json";
import afterFixture from "@/fixtures/usx-after.json";

type ApiIssue = { path: string; message: string };

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const originalSource = JSON.stringify(beforeFixture, null, 2);
  const [source, setSource] = useState(originalSource);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fixed, setFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedName = useMemo(() => {
    try { return JSON.parse(source).tenant?.businessName ?? "Tenant"; }
    catch { return "Invalid JSON"; }
  }, [source]);

  function loadFixture(value: unknown, isFixed: boolean) {
    setSource(JSON.stringify(value, null, 2));
    setReport(null);
    setSelectedId(null);
    setError(null);
    setFixed(isFixed);
  }

  async function audit() {
    setLoading(true);
    setReport(null);
    setSelectedId(null);
    setError(null);

    try {
      JSON.parse(source);
    } catch {
      setLoading(false);
      setError("Fixture must be valid JSON. Check commas, quotes, and brackets before running the audit.");
      return;
    }

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: source
      });
      const data = await response.json();
      if (!response.ok) {
        const issues = (data.issues as ApiIssue[] | undefined)
          ?.map((issue) => `${issue.path}: ${issue.message}`)
          .join(" · ");
        setError(issues ? `${data.error} ${issues}` : data.error ?? "Audit failed");
        return;
      }
      setReport(data);
    } catch {
      setError("The auditor could not be reached. Confirm the deployment is healthy and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFixture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Fixture files must be smaller than 1 MB.");
      return;
    }
    try {
      const text = await file.text();
      JSON.parse(text);
      setSource(text);
      setReport(null);
      setSelectedId(null);
      setFixed(false);
      setError(null);
    } catch {
      setError("The selected file is not valid JSON.");
    }
  }

  const selected = report?.results.find((item) => item.id === selectedId)
    ?? report?.results.find((item) => item.status !== "PASS");
  const pipeline = ["Approved knowledge", "Ingestion", "Prompt builder", "Voice runtime", "Model answer"];
  const lossIndex = report?.diagnosedLayer === "prompt-builder"
    ? 2
    : report?.diagnosedLayer === "surface-context"
      ? 3
      : -1;

  return (
    <main>
      <section className="hero">
        <div>
          <span className="badge">Build Week · Work & Productivity</span>
          <h1>Certify what your AI agent can actually see.</h1>
          <p>
            Luna Grounding Auditor compares source knowledge against the exact context
            exposed to an AI surface, then blocks deployment when critical facts are
            missing, partial, or unsafe.
          </p>
        </div>
        <div className="card fixture-card">
          <div className="small">CERTIFICATION TARGET</div>
          <strong>{parsedName}</strong>
          <p className="small">Synthetic tenant data · voice surface</p>
          <div className="mode-pill"><span className="live-dot" /> Deterministic baseline · GPT-5.6 optional</div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="row input-header">
            <h2>Tenant evidence bundle</h2>
            <div className="input-actions">
              <button className="secondary" onClick={() => loadFixture(beforeFixture, false)}>Load broken</button>
              <button className="secondary" onClick={() => loadFixture(afterFixture, true)}>Load fixed</button>
              <label className="file-button">Upload JSON<input type="file" accept="application/json,.json" onChange={uploadFixture} /></label>
            </div>
          </div>
          <textarea
            aria-label="Tenant evidence bundle JSON"
            value={source}
            onChange={(event) => { setSource(event.target.value); setReport(null); setError(null); }}
          />
          {error && <div className="input-error" role="alert" aria-live="polite">{error}</div>}
          <div className="input-footer">
            <button disabled={loading} onClick={audit}>{loading ? "Auditing…" : "Run deployment audit"}</button>
            <div className="input-actions">
              <button className="secondary" onClick={() => downloadJson(beforeFixture, "grounding-auditor-example.json")}>Download example</button>
              <button className="secondary" onClick={() => loadFixture(beforeFixture, false)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <h2>Certification report</h2>
            {report && <div className="report-mode"><span className="small">{report.mode === "gpt-5.6" ? `GPT-5.6 · ${report.model}` : "Deterministic demo mode"}</span><span className={`status ${report.status}`}>{report.status}</span></div>}
          </div>
          {!report && <p>Run the audit to compare canonical facts with voice-visible context.</p>}
          {report && <>
            {report.gptFallbackReason && <div className="fallback-note"><b>GPT fallback activated</b><span>{report.gptFallbackReason}. The deterministic certification still completed.</span></div>}
            <div className={`decision ${report.status}`}><div><span className="decision-kicker">DEPLOYMENT DECISION</span><strong>{report.status === "PASS" ? "CERTIFIED · SAFE TO DEPLOY" : "NOT SAFE · DEPLOYMENT BLOCKED"}</strong><span>{report.status === "PASS" ? "Every tested claim is visible and grounded." : "The active surface cannot safely answer every tested question."}</span></div><b>{report.score}%</b></div>
            <div className="metric">
              <div><strong>{report.score}</strong><span>Grounding score</span></div>
              <div><strong>{report.totals.PASS}</strong><span>Passed</span></div>
              <div><strong>{report.failedControlIds.length}</strong><span>Blocked controls</span></div>
            </div>
            <div className="report-meta">
              <span><b>Fingerprint</b>{report.fixtureFingerprint}</span>
              <span><b>Diagnosed layer</b>{report.diagnosedLayer}</span>
              <span><b>Generated</b>{new Date(report.generatedAt).toLocaleString()}</span>
            </div>
            <div className="pipeline"><div className="section-label">KNOWLEDGE PATH</div><div className="pipeline-track">{pipeline.map((node, index) => <div className="pipeline-node" key={node}><span className={lossIndex === index ? "node-dot lost" : "node-dot"}>{lossIndex === index ? "×" : "✓"}</span><span>{node}</span>{index < pipeline.length - 1 && <i />}</div>)}</div>{report.status !== "PASS" && <div className="loss-note"><b>Knowledge loss detected at {report.diagnosedLayer}</b><span>{report.smallestSafeFix}</span></div>}</div>
            {report.results.map((result) => (
              <button className={`result ${selected?.id === result.id ? "selected" : ""}`} key={result.id} onClick={() => setSelectedId(result.id)}>
                <div className={`status ${result.status}`}>{result.status}</div>
                <div>
                  <strong>{result.question}</strong>
                  <p className="small">{result.reason}</p>
                  <pre>Visible: {result.visibleEvidence.join(", ") || "none"}{result.missingEvidenceIds.length ? ` · Missing: ${result.missingEvidenceIds.join(", ")}` : ""}</pre>
                </div>
              </button>
            ))}
            {selected && <div className="evidence"><div className="section-label">EVIDENCE EXPLORER</div><h3>{selected.question}</h3><div className="evidence-flow"><div><span>EXPECTED</span><b>{selected.expectedFacts.map((fact) => fact.claim).join(" ") || "Negative control: unsupported service"}</b></div><div><span>VISIBLE CONTEXT</span><b>{selected.visibleEvidence.length ? selected.visibleEvidence.join(", ") : "No matching evidence IDs"}</b></div><div><span>MISSING EVIDENCE</span><b>{selected.missingEvidenceIds.join(", ") || "None"}</b></div><div><span>DETERMINISTIC FINDING</span><b>{selected.reason}</b></div></div>{report.status !== "PASS" && <div className="fix"><div><b>Smallest safe fix</b><span>{fixed ? "Runtime summary regenerated. Re-run certification to verify." : report.smallestSafeFix}</span></div><button onClick={() => loadFixture(afterFixture, true)}>Apply suggested fix</button></div>}</div>}
            <button className="download" onClick={() => downloadJson(report, `${report.tenantSlug}-certification.json`)}>Download certification report</button>
          </>}
        </div>
      </section>
    </main>
  );
}
