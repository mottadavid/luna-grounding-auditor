import { z } from "zod";
import type {
  AuditQuestion,
  Diagnosis,
  GeneratedQuestion,
  GptAuditBundle,
  GroundingEvaluation,
  SimulatedAnswer,
  TenantFixture
} from "../types";
import { structured } from "./client";

const generatedQuestionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    question: { type: "string" },
    expectedFactIds: { type: "array", items: { type: "string" } },
    negativeControl: { type: "boolean" },
    category: { type: "string" },
    rationale: { type: "string" }
  },
  required: ["id", "question", "expectedFactIds", "negativeControl", "category", "rationale"],
  additionalProperties: false
};

const simulatedAnswerSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    citedEvidenceIds: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    abstained: { type: "boolean" },
    claims: { type: "array", items: { type: "string" } }
  },
  required: ["answer", "citedEvidenceIds", "confidence", "abstained", "claims"],
  additionalProperties: false
};

const groundingEvaluationSchema = {
  type: "object",
  properties: {
    grounded: { type: "boolean" },
    omittedFactIds: { type: "array", items: { type: "string" } },
    unsupportedClaims: { type: "array", items: { type: "string" } },
    contradictoryClaims: { type: "array", items: { type: "string" } },
    abstentionAppropriate: { type: "boolean" },
    operationallyUseful: { type: "boolean" },
    explanation: { type: "string" }
  },
  required: ["grounded", "omittedFactIds", "unsupportedClaims", "contradictoryClaims", "abstentionAppropriate", "operationallyUseful", "explanation"],
  additionalProperties: false
};

const diagnosisSchema = {
  type: "object",
  properties: {
    failureLayer: { type: "string" },
    missingFactIds: { type: "array", items: { type: "string" } },
    unsafeClaims: { type: "array", items: { type: "string" } },
    smallestSafeFix: { type: "string" },
    explanation: { type: "string" }
  },
  required: ["failureLayer", "missingFactIds", "unsafeClaims", "smallestSafeFix", "explanation"],
  additionalProperties: false
};

const auditBundleSchema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          ...generatedQuestionSchema.properties,
          answer: simulatedAnswerSchema,
          evaluation: groundingEvaluationSchema
        },
        required: [
          "id",
          "question",
          "expectedFactIds",
          "negativeControl",
          "category",
          "rationale",
          "answer",
          "evaluation"
        ],
        additionalProperties: false
      }
    },
    diagnosis: diagnosisSchema
  },
  required: ["results", "diagnosis"],
  additionalProperties: false
};

const generatedQuestionOutput = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  expectedFactIds: z.array(z.string().min(1)).min(1),
  negativeControl: z.boolean(),
  category: z.string().min(1),
  rationale: z.string().min(1)
});

const simulatedAnswerOutput = z.object({
  answer: z.string(),
  citedEvidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  abstained: z.boolean(),
  claims: z.array(z.string())
});

const groundingEvaluationOutput = z.object({
  grounded: z.boolean(),
  omittedFactIds: z.array(z.string()),
  unsupportedClaims: z.array(z.string()),
  contradictoryClaims: z.array(z.string()),
  abstentionAppropriate: z.boolean(),
  operationallyUseful: z.boolean(),
  explanation: z.string()
});

const diagnosisOutput = z.object({
  failureLayer: z.string(),
  missingFactIds: z.array(z.string()),
  unsafeClaims: z.array(z.string()),
  smallestSafeFix: z.string(),
  explanation: z.string()
});

const auditBundleOutput = z.object({
  results: z.array(generatedQuestionOutput.extend({
    answer: simulatedAnswerOutput,
    evaluation: groundingEvaluationOutput
  })).min(3).max(8),
  diagnosis: diagnosisOutput
});

function validateEvidenceReferences(bundle: GptAuditBundle, fixture: TenantFixture): GptAuditBundle {
  const allowedFactIds = new Set(fixture.canonicalFacts.map((fact) => fact.id));
  for (const result of bundle.results) {
    for (const id of [...result.expectedFactIds, ...result.answer.citedEvidenceIds, ...result.evaluation.omittedFactIds]) {
      if (!allowedFactIds.has(id)) {
        throw new Error(`GPT audit referenced unknown evidence id: ${id}`);
      }
    }
  }
  for (const id of bundle.diagnosis.missingFactIds) {
    if (!allowedFactIds.has(id)) {
      throw new Error(`GPT diagnosis referenced unknown evidence id: ${id}`);
    }
  }
  return bundle;
}

export async function runGptAudit(fixture: TenantFixture): Promise<GptAuditBundle> {
  const raw = await structured<GptAuditBundle>(
    "grounding_audit_bundle",
    auditBundleSchema,
    [
      "Act as a deployment certification auditor for an AI agent.",
      "Generate realistic adversarial customer questions, including colloquial variants and at least one negative control when the supplied facts support it.",
      "For every question, simulate an answer using ONLY surfaceVisibleContext. Never use canonical facts unless their evidence is visible in that context.",
      "Cited evidence ids must be selected only from the supplied canonicalFacts ids. If context is insufficient, abstain rather than inventing an answer.",
      "Then evaluate grounding, omissions, contradictions, and operational usefulness.",
      "Finally diagnose the most likely pipeline failure layer and recommend the smallest safe remediation.",
      "If every result is grounded and safe, return failureLayer='none', empty diagnosis arrays, and smallestSafeFix='No remediation required.'"
    ].join(" "),
    {
      tenant: fixture.tenant,
      canonicalFacts: fixture.canonicalFacts,
      surfaceVisibleContext: fixture.surfaces,
      existingQuestions: fixture.questions
    }
  );
  return validateEvidenceReferences(auditBundleOutput.parse(raw), fixture);
}

const questionSchema = {
  type: "object",
  properties: { questions: { type: "array", items: generatedQuestionSchema } },
  required: ["questions"],
  additionalProperties: false
};
const questionOutput = z.object({ questions: z.array(generatedQuestionOutput) });

export async function generateQuestions(fixture: TenantFixture): Promise<GeneratedQuestion[]> {
  const out = questionOutput.parse(await structured(
    "adversarial_questions",
    questionSchema,
    "Generate realistic adversarial customer questions. Use only the supplied canonical facts; include negative controls and colloquial variants.",
    { facts: fixture.canonicalFacts, existing: fixture.questions }
  ));
  return out.questions;
}

export async function simulateAnswer(question: AuditQuestion, visibleText: string): Promise<SimulatedAnswer> {
  return simulatedAnswerOutput.parse(await structured(
    "simulated_answer",
    simulatedAnswerSchema,
    "Answer using ONLY the supplied surface context. Never use outside knowledge. If evidence is insufficient, abstain and say what is unknown.",
    { question, visibleText }
  ));
}

export async function evaluateGrounding(question: AuditQuestion, visibleText: string, answer: SimulatedAnswer, facts: TenantFixture["canonicalFacts"]): Promise<GroundingEvaluation> {
  return groundingEvaluationOutput.parse(await structured(
    "grounding_evaluation",
    groundingEvaluationSchema,
    "Judge whether every claim is supported by the exact visible context. Treat unsupported affirmative claims as unsafe.",
    { question, visibleText, answer, facts }
  ));
}

export async function diagnoseFailure(evaluation: GroundingEvaluation, question: AuditQuestion): Promise<Diagnosis> {
  return diagnosisOutput.parse(await structured(
    "failure_diagnosis",
    diagnosisSchema,
    "Classify the most likely pipeline failure layer and recommend the smallest safe remediation.",
    { evaluation, question }
  ));
}
