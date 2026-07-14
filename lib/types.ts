export type AuditStatus = "PASS" | "PARTIAL" | "FAIL";
export type CanonicalFact = { id: string; category: string; claim: string; evidence: string };
export type SurfaceContext = { surface: string; visibleText: string };
export type AuditQuestion = { id: string; question: string; expectedFactIds: string[]; negativeControl?: boolean };
export type TenantFixture = {
  tenant: { slug: string; businessName: string };
  canonicalFacts: CanonicalFact[];
  surfaces: SurfaceContext[];
  questions: AuditQuestion[];
};
export type QuestionResult = {
  id: string;
  question: string;
  status: AuditStatus;
  expectedFacts: CanonicalFact[];
  visibleEvidence: string[];
  missingEvidenceIds: string[];
  reason: string;
};
export type AuditReport = {
  reportVersion: "1.0";
  tenantSlug: string;
  fixtureFingerprint: string;
  score: number;
  status: AuditStatus;
  deploymentSafe: boolean;
  totals: Record<AuditStatus, number>;
  failedControlIds: string[];
  results: QuestionResult[];
  diagnosedLayer: string;
  smallestSafeFix: string;
  generatedAt: string;
  mode?: "deterministic" | "gpt-5.6";
  model?: string;
  requestedModel?: string;
  gptFallbackReason?: string;
  diagnosis?: Diagnosis;
};

export type GeneratedQuestion = AuditQuestion & { category: string; rationale: string };
export type SimulatedAnswer = { answer: string; citedEvidenceIds: string[]; confidence: number; abstained: boolean; claims: string[] };
export type GroundingEvaluation = { grounded: boolean; omittedFactIds: string[]; unsupportedClaims: string[]; contradictoryClaims: string[]; abstentionAppropriate: boolean; operationallyUseful: boolean; explanation: string };
export type Diagnosis = { failureLayer: string; missingFactIds: string[]; unsafeClaims: string[]; smallestSafeFix: string; explanation: string };
export type GptAuditResult = GeneratedQuestion & { answer: SimulatedAnswer; evaluation: GroundingEvaluation };
export type GptAuditBundle = { results: GptAuditResult[]; diagnosis: Diagnosis };
