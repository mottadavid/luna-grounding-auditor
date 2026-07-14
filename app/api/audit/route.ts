import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";
import { formatFixtureIssues, tenantFixtureSchema } from "@/lib/schema";
import { openAiMode, modelName } from "@/lib/openai/client";
import { diagnoseFailure, evaluateGrounding, generateQuestions, simulateAnswer } from "@/lib/openai/workflow";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Fixture must be valid JSON.", issues: [{ path: "fixture", message: "Unable to parse JSON payload" }] },
      { status: 400 }
    );
  }

  const parsed = tenantFixtureSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Fixture validation failed.", issues: formatFixtureIssues(parsed.error) },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const deterministicReport = runAudit(input);
  const mode = openAiMode();
  if (mode === "deterministic") {
    return NextResponse.json({ ...deterministicReport, mode });
  }

  try {
    const questions = await generateQuestions(input);
    const gptResults = [];
    let diagnosis;
    const visibleText = input.surfaces.map((surface) => surface.visibleText).join("\n");
    for (const question of questions) {
      const answer = await simulateAnswer(question, visibleText);
      const evaluation = await evaluateGrounding(question, visibleText, answer, input.canonicalFacts);
      if (!evaluation.grounded || evaluation.unsupportedClaims.length) {
        diagnosis = await diagnoseFailure(evaluation, question);
      }
      gptResults.push({ ...question, answer, evaluation });
    }

    return NextResponse.json({
      ...runAudit({ ...input, questions }),
      mode,
      model: modelName(),
      generatedQuestions: questions,
      gptResults,
      diagnosis
    });
  } catch (error) {
    return NextResponse.json({
      ...deterministicReport,
      mode: "deterministic",
      requestedModel: modelName(),
      gptFallbackReason: error instanceof Error ? error.message : "GPT workflow unavailable"
    });
  }
}
