import { describe, expect, it } from "vitest";
import { runAudit } from "../lib/audit";
import { fingerprintFixture } from "../lib/fingerprint";
import { certifyForDeployment } from "../lib/gate";
import { openAiMode } from "../lib/openai/client";
import { tenantFixtureSchema } from "../lib/schema";
import beforeFixture from "../fixtures/usx-before.json";
import afterFixture from "../fixtures/usx-after.json";

describe("grounding audit", () => {
  it("uses deterministic mode without an API key", () => {
    expect(openAiMode()).toBe("deterministic");
  });

  it("blocks the broken tenant surface with release evidence", () => {
    const report = runAudit(beforeFixture);
    expect(report.status).toBe("FAIL");
    expect(report.deploymentSafe).toBe(false);
    expect(report.totals.FAIL).toBeGreaterThan(0);
    expect(report.failedControlIds.length).toBeGreaterThan(0);
    expect(report.diagnosedLayer).toBe("prompt-builder");
    expect(report.smallestSafeFix).toContain("Expose the approved");
    expect(report.fixtureFingerprint).toMatch(/^fnv1a32:[0-9a-f]{8}$/);
    expect(report.results.some((result) => result.missingEvidenceIds.length > 0)).toBe(true);
  });

  it("passes the remediated tenant surface", () => {
    const report = runAudit(afterFixture);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.totals.FAIL).toBe(0);
    expect(report.deploymentSafe).toBe(true);
    expect(report.diagnosedLayer).toBe("none");
    expect(report.smallestSafeFix).toBe("No remediation required.");
  });

  it("creates a stable fingerprint and changes it when the fixture changes", () => {
    const cloned = JSON.parse(JSON.stringify(beforeFixture));
    expect(fingerprintFixture(beforeFixture)).toBe(fingerprintFixture(cloned));
    expect(fingerprintFixture(beforeFixture)).not.toBe(fingerprintFixture(afterFixture));
  });

  it("returns a failing CI status for unsafe fixtures and 200 for safe fixtures", () => {
    const blocked = certifyForDeployment(beforeFixture);
    const certified = certifyForDeployment(afterFixture);
    expect(blocked.httpStatus).toBe(422);
    expect(blocked.deploymentAllowed).toBe(false);
    expect(certified.httpStatus).toBe(200);
    expect(certified.deploymentAllowed).toBe(true);
  });

  it("rejects question references to unknown fact ids", () => {
    const invalid = {
      ...beforeFixture,
      questions: [{
        id: "invalid-question",
        question: "Can the agent answer this?",
        expectedFactIds: ["missing-fact"]
      }]
    };
    const result = tenantFixtureSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Unknown fact id"))).toBe(true);
    }
  });
});
