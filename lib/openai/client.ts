const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

export function openAiMode() { return process.env.OPENAI_API_KEY ? "gpt-5.6" as const : "deterministic" as const; }
export function modelName() { return MODEL; }

type ResponseContent = { type?: string; text?: string; refusal?: string };
type ResponseItem = { type?: string; content?: ResponseContent[] };
type ResponsesApiBody = {
  output_text?: string;
  output?: ResponseItem[];
  error?: { message?: string };
};

function extractOutputText(body: ResponsesApiBody): string | undefined {
  if (body.output_text) return body.output_text;
  const text = body.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("");
  return text || undefined;
}

export async function structured<T>(name: string, schema: object, instructions: string, input: unknown): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for GPT-5.6 mode");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        input: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(input) }
        ],
        text: { format: { type: "json_schema", name, strict: true, schema } }
      })
    });
    const body = await response.json() as ResponsesApiBody;
    if (!response.ok) {
      throw new Error(body.error?.message ? `OpenAI request failed: ${body.error.message}` : `OpenAI request failed (${response.status})`);
    }
    const outputText = extractOutputText(body);
    if (!outputText) throw new Error("OpenAI returned no structured output");
    return JSON.parse(outputText) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI request timed out after 30 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
