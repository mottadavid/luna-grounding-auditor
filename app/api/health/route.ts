import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "luna-grounding-auditor",
    mode: process.env.OPENAI_API_KEY ? "gpt-5.6-available" : "deterministic-demo",
    timestamp: new Date().toISOString(),
  });
}
