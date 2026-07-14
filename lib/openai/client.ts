const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

export function openAiMode() { return process.env.OPENAI_API_KEY ? "gpt-5.6" as const : "deterministic" as const; }
export function modelName() { return MODEL; }

export async function structured<T>(name: string, schema: object, instructions: string, input: unknown): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for GPT-5.6 mode");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: [{ role: "system", content: instructions }, { role: "user", content: JSON.stringify(input) }], text: { format: { type: "json_schema", name, strict: true, schema } } })
    });
    if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
    const body = await response.json() as { output_text?: string };
    if (!body.output_text) throw new Error("OpenAI returned no structured output");
    return JSON.parse(body.output_text) as T;
  } finally { clearTimeout(timeout); }
}
