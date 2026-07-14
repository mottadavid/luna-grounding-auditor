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
  id: string; question: string; status: AuditStatus;
  expectedFacts: CanonicalFact[]; visibleEvidence: string[]; reason: string;
};
export type AuditReport = {
  tenantSlug: string; score: number; status: AuditStatus;
  totals: Record<AuditStatus, number>; results: QuestionResult[]; generatedAt: string;
};
