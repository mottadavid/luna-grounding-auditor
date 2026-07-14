import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";
import { tenantFixtureSchema } from "@/lib/schema";
import { openAiMode, modelName } from "@/lib/openai/client";
import { diagnoseFailure, evaluateGrounding, generateQuestions, simulateAnswer } from "@/lib/openai/workflow";

export async function POST(request: Request) {
  try {
    const input = tenantFixtureSchema.parse(await request.json());
    const mode = openAiMode();
    if (mode === "deterministic") return NextResponse.json({ ...runAudit(input), mode });
    const questions = await generateQuestions(input);
    const gptResults = [];
    let diagnosis;
    const visibleText = input.surfaces.map((surface) => surface.visibleText).join("\n");
    for (const question of questions) {
      const answer = await simulateAnswer(question, visibleText);
      const evaluation = await evaluateGrounding(question, visibleText, answer, input.canonicalFacts);
      if (!evaluation.grounded || evaluation.unsupportedClaims.length) diagnosis = await diagnoseFailure(evaluation, question);
      gptResults.push({ ...question, answer, evaluation });
    }
    return NextResponse.json({ ...runAudit({ ...input, questions }), mode, model: modelName(), generatedQuestions: questions, gptResults, diagnosis });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
