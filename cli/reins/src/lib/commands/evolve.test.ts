import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AuditResult } from "../types";
import { runEvolve } from "./evolve";

describe("runEvolve unit behavior", () => {
  test("suppresses pack recommendation reason when maturity gating defers agent-factory", () => {
    const dir = mkdtempSync(join(tmpdir(), "reins-evolve-unit-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "sample", scripts: { dev: "node index.js" } }));

    const mockAuditResult: AuditResult = {
      project: "sample",
      timestamp: new Date().toISOString(),
      scores: {
        repository_knowledge: { score: 3, max: 3, findings: [] },
        architecture_enforcement: { score: 3, max: 3, findings: [] },
        agent_legibility: { score: 3, max: 3, findings: [] },
        golden_principles: { score: 3, max: 3, findings: [] },
        agent_workflow: { score: 1, max: 3, findings: [] },
        garbage_collection: { score: 1, max: 3, findings: [] },
      },
      total_score: 14,
      max_score: 18,
      maturity_level: "L3: Autonomous",
      recommendations: [],
    };

    let output = "";
    const originalLog = console.log;
    console.log = (value?: unknown) => {
      output = String(value ?? "");
    };

    try {
      runEvolve(dir, false, {
        runAudit: () => mockAuditResult,
        runInit: () => {},
      });
    } finally {
      console.log = originalLog;
      rmSync(dir, { recursive: true, force: true });
    }

    const result = JSON.parse(output);
    expect(result.pack_recommendation?.recommended).toBeNull();
    expect(result.pack_recommendation?.reason).toContain("suppressed by maturity level");
  });
});
