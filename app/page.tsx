"use client";

import { useMemo, useState } from "react";
import type { AuditReport } from "@/lib/types";
import beforeFixture from "@/fixtures/usx-before.json";
import afterFixture from "@/fixtures/usx-after.json";

export default function Home() {
  const [source, setSource] = useState(JSON.stringify(beforeFixture, null, 2));
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const parsedName = useMemo(() => {
    try { return JSON.parse(source).tenant?.businessName ?? "Tenant"; }
    catch { return "Invalid JSON"; }
  }, [source]);

  async function audit() {
    setLoading(true);
    setReport(null);
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
        <div className="card">
          <div className="small">Current fixture</div>
          <strong>{parsedName}</strong>
          <p className="small">Synthetic tenant data modeled on a real grounding failure.</p>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="row">
            <h2>Tenant evidence bundle</h2>
            <div style={{display:"flex", gap:8}}>
              <button onClick={() => { setSource(JSON.stringify(beforeFixture, null, 2)); setReport(null); }}>Load broken</button>
              <button onClick={() => { setSource(JSON.stringify(afterFixture, null, 2)); setReport(null); }}>Load fixed</button>
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
            {report && <span className={`status ${report.status}`}>{report.status}</span>}
          </div>
          {!report && <p>Run the audit to compare canonical facts with voice-visible context.</p>}
          {report && <>
            <div className="metric">
              <div><strong>{report.score}</strong><span>Grounding score</span></div>
              <div><strong>{report.totals.PASS}</strong><span>Passed</span></div>
              <div><strong>{report.totals.FAIL}</strong><span>Blocked</span></div>
            </div>
            {report.results.map((result) => (
              <div className="result" key={result.id}>
                <div className={`status ${result.status}`}>{result.status}</div>
                <div>
                  <strong>{result.question}</strong>
                  <p className="small">{result.reason}</p>
                  <pre>Evidence IDs: {result.visibleEvidence.join(", ") || "none"}</pre>
                </div>
              </div>
            ))}
          </>}
        </div>
      </section>
    </main>
  );
}
