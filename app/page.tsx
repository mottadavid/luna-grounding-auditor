"use client";

import { useMemo, useState } from "react";
import type { AuditReport } from "@/lib/types";
import beforeFixture from "@/fixtures/usx-before.json";
import afterFixture from "@/fixtures/usx-after.json";

export default function Home() {
  const [source, setSource] = useState(JSON.stringify(beforeFixture, null, 2));
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fixed, setFixed] = useState(false);

  const parsedName = useMemo(() => {
    try { return JSON.parse(source).tenant?.businessName ?? "Tenant"; }
    catch { return "Invalid JSON"; }
  }, [source]);

  async function audit() {
    setLoading(true);
    setReport(null); setSelectedId(null);
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: source
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return alert(data.error ?? "Audit failed");
    setReport(data);
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `${report.tenantSlug}-certification.json`; link.click(); URL.revokeObjectURL(url);
  }

  const selected = report?.results.find((item) => item.id === selectedId) ?? report?.results.find((item) => item.status !== "PASS");
  const pipeline = ["Approved knowledge", "Ingestion", "Prompt builder", "Voice runtime", "Model answer"];

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
          <div className="mode-pill"><span className="live-dot" /> Server-side GPT-5.6 optional</div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="row">
            <h2>Tenant evidence bundle</h2>
            <div style={{display:"flex", gap:8}}>
              <button className="secondary" onClick={() => { setSource(JSON.stringify(beforeFixture, null, 2)); setReport(null); setFixed(false); }}>Load broken</button>
              <button className="secondary" onClick={() => { setSource(JSON.stringify(afterFixture, null, 2)); setReport(null); setFixed(true); }}>Load fixed</button>
            </div>
          </div>
          <textarea value={source} onChange={(event) => setSource(event.target.value)} />
          <div style={{marginTop:14}}>
            <button disabled={loading} onClick={audit}>{loading ? "Auditing…" : "Run deployment audit"}</button>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <h2>Certification report</h2>
            {report && <div style={{display:"flex", gap:8, alignItems:"center"}}><span className="small">{report.mode === "gpt-5.6" ? `GPT-5.6 · ${report.model}` : "Deterministic demo mode"}</span><span className={`status ${report.status}`}>{report.status}</span></div>}
          </div>
          {!report && <p>Run the audit to compare canonical facts with voice-visible context.</p>}
          {report && <>
            <div className={`decision ${report.status}`}><div><span className="decision-kicker">DEPLOYMENT DECISION</span><strong>{report.status === "PASS" ? "CERTIFIED · SAFE TO DEPLOY" : "NOT SAFE · DEPLOYMENT BLOCKED"}</strong><span>{report.status === "PASS" ? "Every tested claim is visible and grounded." : "The active surface cannot safely answer every tested question."}</span></div><b>{report.score}%</b></div>
            <div className="metric">
              <div><strong>{report.score}</strong><span>Grounding score</span></div>
              <div><strong>{report.totals.PASS}</strong><span>Passed</span></div>
              <div><strong>{report.totals.FAIL}</strong><span>Blocked</span></div>
            </div>
            <div className="pipeline"><div className="section-label">KNOWLEDGE PATH</div><div className="pipeline-track">{pipeline.map((node, index) => <div className="pipeline-node" key={node}><span className={report.status === "FAIL" && index === 2 ? "node-dot lost" : "node-dot"}>{report.status === "FAIL" && index === 2 ? "×" : "✓"}</span><span>{node}</span>{index < pipeline.length - 1 && <i />}</div>)}</div>{report.status !== "PASS" && <div className="loss-note"><b>Knowledge loss detected at Prompt builder</b><span>Canonical facts exist, but were not carried into the voice-visible context.</span></div>}</div>
            {report.results.map((result) => (
              <button className={`result ${selected?.id === result.id ? "selected" : ""}`} key={result.id} onClick={() => setSelectedId(result.id)}>
                <div className={`status ${result.status}`}>{result.status}</div>
                <div>
                  <strong>{result.question}</strong>
                  <p className="small">{result.reason}</p>
                  <pre>Evidence IDs: {result.visibleEvidence.join(", ") || "none"}</pre>
                </div>
              </button>
            ))}
            {selected && <div className="evidence"><div className="section-label">EVIDENCE EXPLORER</div><h3>{selected.question}</h3><div className="evidence-flow"><div><span>EXPECTED</span><b>{selected.expectedFacts.map((fact) => fact.claim).join(" ") || "Negative control: unsupported service"}</b></div><div><span>VISIBLE CONTEXT</span><b>{selected.visibleEvidence.length ? selected.visibleEvidence.join(", ") : "No matching evidence IDs"}</b></div><div><span>DETERMINISTIC FINDING</span><b>{selected.reason}</b></div></div>{report.status !== "PASS" && <div className="fix"><div><b>Smallest safe fix</b><span>{fixed ? "Runtime summary regenerated. Re-run certification to verify." : "Add the missing fact to the priority prompt summary, then re-run certification."}</span></div><button onClick={() => { setSource(JSON.stringify(afterFixture, null, 2)); setFixed(true); }}>Apply suggested fix</button></div>}</div>}
            <button className="download" onClick={downloadReport}>Download certification report</button>
          </>}
        </div>
      </section>
    </main>
  );
}
