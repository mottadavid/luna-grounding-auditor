import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";
import { tenantFixtureSchema } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const input = tenantFixtureSchema.parse(await request.json());
    return NextResponse.json(runAudit(input));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
