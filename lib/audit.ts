import { fingerprintFixture } from "./fingerprint";
import type { AuditReport, AuditStatus, CanonicalFact, TenantFixture } from "./types";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const keywords = (fact: CanonicalFact) =>
  normalize(`${fact.claim} ${fact.evidence}`).split(" ").filter((word) => word.length > 3);

function surfaceContainsFact(surfaceText: string, fact: CanonicalFact): boolean {
  const haystack = normalize(surfaceText);
  if (fact.category === "negative-control" && /not an in house|not in house|not performed in house|does not do/.test(haystack)) return false;
  const terms = keywords(fact);
  const matched = terms.filter((term) => haystack.includes(term));
  return matched.length >= Math.max(2, Math.ceil(terms.length * 0.25));
}

function diagnoseLayer(results: AuditReport["results"]): string {
  if (results.every((result) => result.status === "PASS")) return "none";
  const unsafeSurface = results.some(
    (result) => result.status === "FAIL" && result.expectedFacts.some((fact) => fact.category === "negative-control")
  );
  return unsafeSurface ? "surface-context" : "prompt-builder";
}

function recommendFix(results: AuditReport["results"]): string {
  const unsafe = results.some(
    (result) => result.status === "FAIL" && result.expectedFacts.some((fact) => fact.category === "negative-control")
  );
  const missingCategories = Array.from(
    new Set(
      results
        .filter((result) => result.status !== "PASS")
        .flatMap((result) => result.expectedFacts)
        .filter((fact) => fact.category !== "negative-control")
        .map((fact) => fact.category)
    )
  );

  const actions: string[] = [];
  if (missingCategories.length) {
    actions.push(`Expose the approved ${missingCategories.join(", ")} facts to the tested surface`);
  }
  if (unsafe) actions.push("remove unsupported affirmative claims from the surface-visible context");
  if (!actions.length) return "No remediation required.";
  return `${actions.join(" and ")}, then re-run certification.`;
}

export function runAudit(fixture: TenantFixture): AuditReport {
  const mergedSurface = fixture.surfaces.map((surface) => surface.visibleText).join("\n");
  const byId = new Map(fixture.canonicalFacts.map((fact) => [fact.id, fact]));

  const results = fixture.questions.map((question) => {
    const expectedFacts = question.expectedFactIds
      .map((id) => byId.get(id))
      .filter((fact): fact is CanonicalFact => Boolean(fact));

    const visibleEvidence = expectedFacts
      .filter((fact) => surfaceContainsFact(mergedSurface, fact))
      .map((fact) => fact.id);
    const missingEvidenceIds = expectedFacts
      .map((fact) => fact.id)
      .filter((id) => !visibleEvidence.includes(id));

    let status: AuditStatus;
    let reason: string;

    if (question.negativeControl) {
      const unsafe = expectedFacts.some((fact) => surfaceContainsFact(mergedSurface, fact));
      status = unsafe ? "FAIL" : "PASS";
      reason = unsafe
        ? "The surface-visible context may cause an unsupported affirmative claim."
        : "The unsupported service is absent from the agent-visible context.";
    } else if (visibleEvidence.length === expectedFacts.length && expectedFacts.length > 0) {
      status = "PASS";
      reason = "All required facts are visible to the tested surface.";
    } else if (visibleEvidence.length > 0) {
      status = "PARTIAL";
      reason = "Only part of the required evidence is visible.";
    } else {
      status = "FAIL";
      reason = "The source fact exists, but it is not visible to the tested surface.";
    }

    return { id: question.id, question: question.question, status, expectedFacts, visibleEvidence, missingEvidenceIds, reason };
  });

  const totals = results.reduce(
    (acc, result) => { acc[result.status] += 1; return acc; },
    { PASS: 0, PARTIAL: 0, FAIL: 0 } as Record<AuditStatus, number>
  );
  const score = Math.round(((totals.PASS + totals.PARTIAL * 0.5) / Math.max(results.length, 1)) * 100);
  const status: AuditStatus = totals.FAIL > 0 ? "FAIL" : totals.PARTIAL > 0 ? "PARTIAL" : "PASS";

  return {
    reportVersion: "1.0",
    tenantSlug: fixture.tenant.slug,
    fixtureFingerprint: fingerprintFixture(fixture),
    score,
    status,
    deploymentSafe: status === "PASS",
    totals,
    failedControlIds: results.filter((result) => result.status !== "PASS").map((result) => result.id),
    results,
    diagnosedLayer: diagnoseLayer(results),
    smallestSafeFix: recommendFix(results),
    generatedAt: new Date().toISOString()
  };
}
