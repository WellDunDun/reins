import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { buildAuditRuntimeContext, createAuditResult, readVerifiedDocs } from "../audit/context";
import { applyAuditScoring, resolveMaturityLevel } from "../audit/scoring";
import type { AuditResult } from "../types";

export { readVerifiedDocs };

export function runAudit(targetPath: string): AuditResult {
  const targetDir = resolve(targetPath);
  if (!existsSync(targetDir)) {
    throw new Error(`Directory does not exist: ${targetDir}`);
  }

  const context = buildAuditRuntimeContext(targetDir);
  const result = createAuditResult(basename(targetDir));

  applyAuditScoring(result, context);

  result.total_score = Object.values(result.scores).reduce((sum, score) => sum + score.score, 0);
  result.maturity_level = resolveMaturityLevel(result.total_score);
  if (result.recommendations.length === 0) {
    result.recommendations.push("Project is well-structured. Consider evolving to next maturity level.");
  }

  return result;
}

export function runAuditCommand(targetPath: string): void {
  try {
    const result = runAudit(targetPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
