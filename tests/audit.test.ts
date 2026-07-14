import { describe, expect, it } from "vitest";
import { runAudit } from "../lib/audit";
import { openAiMode } from "../lib/openai/client";
import beforeFixture from "../fixtures/usx-before.json";
import afterFixture from "../fixtures/usx-after.json";

describe("grounding audit", () => {
  it("uses deterministic mode without an API key", () => {
    expect(openAiMode()).toBe("deterministic");
  });
  it("blocks the broken tenant surface", () => {
    const report = runAudit(beforeFixture);
    expect(report.status).toBe("FAIL");
    expect(report.totals.FAIL).toBeGreaterThan(0);
  });

  it("passes the remediated tenant surface", () => {
    const report = runAudit(afterFixture);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.totals.FAIL).toBe(0);
  });
});
