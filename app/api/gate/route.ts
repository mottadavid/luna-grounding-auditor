import { NextResponse } from "next/server";
import { certifyForDeployment } from "@/lib/gate";
import { formatFixtureIssues, tenantFixtureSchema } from "@/lib/schema";

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

  const result = certifyForDeployment(parsed.data);
  return NextResponse.json(
    {
      deploymentAllowed: result.deploymentAllowed,
      certification: result.report
    },
    {
      status: result.httpStatus,
      headers: {
        "X-Grounding-Certification": result.deploymentAllowed ? "PASS" : "BLOCKED"
      }
    }
  );
}
