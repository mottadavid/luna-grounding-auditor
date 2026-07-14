import { z } from "zod";

const canonicalFactSchema = z.object({
  id: z.string().min(1, "Fact id is required"),
  category: z.string().min(1, "Fact category is required"),
  claim: z.string().min(1, "Fact claim is required"),
  evidence: z.string().min(1, "Fact evidence is required")
});

const auditQuestionSchema = z.object({
  id: z.string().min(1, "Question id is required"),
  question: z.string().min(1, "Question text is required"),
  expectedFactIds: z.array(z.string().min(1)).min(1, "At least one expected fact id is required"),
  negativeControl: z.boolean().optional()
});

export const tenantFixtureSchema = z.object({
  tenant: z.object({
    slug: z.string().min(1, "Tenant slug is required"),
    businessName: z.string().min(1, "Business name is required")
  }),
  canonicalFacts: z.array(canonicalFactSchema).min(1, "At least one canonical fact is required"),
  surfaces: z.array(
    z.object({ surface: z.string().min(1, "Surface name is required"), visibleText: z.string() })
  ).min(1, "At least one surface is required"),
  questions: z.array(auditQuestionSchema).min(1, "At least one audit question is required")
}).superRefine((fixture, context) => {
  const factIds = new Set<string>();
  fixture.canonicalFacts.forEach((fact, index) => {
    if (factIds.has(fact.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canonicalFacts", index, "id"],
        message: `Duplicate fact id: ${fact.id}`
      });
    }
    factIds.add(fact.id);
  });

  const questionIds = new Set<string>();
  fixture.questions.forEach((question, index) => {
    if (questionIds.has(question.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", index, "id"],
        message: `Duplicate question id: ${question.id}`
      });
    }
    questionIds.add(question.id);

    question.expectedFactIds.forEach((factId, factIndex) => {
      if (!factIds.has(factId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", index, "expectedFactIds", factIndex],
          message: `Unknown fact id: ${factId}`
        });
      }
    });
  });
});

export function formatFixtureIssues(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "fixture",
    message: issue.message
  }));
}
