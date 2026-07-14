import { runAudit } from "./audit";
import type { AuditReport, TenantFixture } from "./types";

export type DeploymentGateResult = {
  deploymentAllowed: boolean;
  httpStatus: 200 | 422;
  report: AuditReport;
};

export function certifyForDeployment(fixture: TenantFixture): DeploymentGateResult {
  const report = runAudit(fixture);
  const deploymentAllowed = report.status === "PASS";
  return {
    deploymentAllowed,
    httpStatus: deploymentAllowed ? 200 : 422,
    report
  };
}
