import { existsSync, readFileSync } from "node:fs";
import type { AuditResult } from "../types";

interface DimensionDelta {
  dimension: string;
  before: number;
  after: number;
  delta: number;
  max: number;
}

interface CompareResult {
  command: "compare";
  project: string;
  before_score: number;
  after_score: number;
  score_delta: number;
  max_score: number;
  before_level: string;
  after_level: string;
  level_changed: boolean;
  dimensions: DimensionDelta[];
  new_findings: string[];
  lost_findings: string[];
}

export function runCompare(
  currentAuditPath: string,
  baselinePath: string,
  deps: { runAudit: (path: string) => AuditResult },
): void {
  if (!existsSync(baselinePath)) {
    console.error(JSON.stringify({ error: `Baseline file not found: ${baselinePath}` }));
    process.exit(1);
  }

  let baseline: AuditResult;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
  } catch {
    console.error(JSON.stringify({ error: `Failed to parse baseline JSON: ${baselinePath}` }));
    process.exit(1);
  }

  let current: AuditResult;
  try {
    current = deps.runAudit(currentAuditPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }

  const dimensions: DimensionDelta[] = [];
  const allFindings = { before: new Set<string>(), after: new Set<string>() };

  for (const key of Object.keys(current.scores) as Array<keyof typeof current.scores>) {
    const before = baseline.scores?.[key]?.score ?? 0;
    const after = current.scores[key].score;
    const max = current.scores[key].max;
    dimensions.push({ dimension: key, before, after, delta: after - before, max });

    for (const f of baseline.scores?.[key]?.findings ?? []) allFindings.before.add(f);
    for (const f of current.scores[key].findings) allFindings.after.add(f);
  }

  const newFindings = [...allFindings.after].filter((f) => !allFindings.before.has(f));
  const lostFindings = [...allFindings.before].filter((f) => !allFindings.after.has(f));

  const result: CompareResult = {
    command: "compare",
    project: current.project,
    before_score: baseline.total_score ?? 0,
    after_score: current.total_score,
    score_delta: current.total_score - (baseline.total_score ?? 0),
    max_score: current.max_score,
    before_level: baseline.maturity_level ?? "unknown",
    after_level: current.maturity_level,
    level_changed: (baseline.maturity_level ?? "unknown") !== current.maturity_level,
    dimensions,
    new_findings: newFindings,
    lost_findings: lostFindings,
  };

  console.log(JSON.stringify(result, null, 2));
}
