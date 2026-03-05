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
      schema_version: "2.0",
      timestamp: new Date().toISOString(),
      scores: {
        repository_knowledge: { score: 3, max: 4, findings: [] },
        architecture_enforcement: { score: 3, max: 3, findings: [] },
        agent_legibility: { score: 3, max: 4, findings: [] },
        golden_principles: { score: 3, max: 3, findings: [] },
        agent_workflow: { score: 3, max: 4, findings: [] },
        garbage_collection: { score: 2, max: 3, findings: [] },
      },
      total_score: 17,
      max_score: 21,
      maturity_level: "L3: Full Outloop",
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
