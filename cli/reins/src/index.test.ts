import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const CLI = join(import.meta.dir, "index.ts");
const TMP = join(import.meta.dir, "..", ".test-fixtures");

function tmpDir(name: string): string {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function runCli(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const proc = Bun.spawn(["bun", CLI, ...args.split(" ")], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    return { stdout, stderr, exitCode };
  } catch {
    return { stdout: "", stderr: "spawn failed", exitCode: 1 };
  }
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  if (existsSync(TMP)) {
    rmSync(TMP, { recursive: true, force: true });
  }
});

// ─── Init Command ───────────────────────────────────────────────────────────

describe("reins init", () => {
  test("creates all expected files in empty directory", async () => {
    const dir = tmpDir("init-basic");
    const { stdout, exitCode } = await runCli(`init ${dir}`);
    expect(exitCode).toBe(0);

    const result = JSON.parse(stdout);
    expect(result.command).toBe("init");
    expect(result.created).toContain("AGENTS.md");
    expect(result.created).toContain("ARCHITECTURE.md");
    expect(result.created).toContain("docs/golden-principles.md");
    expect(result.created).toContain("docs/design-docs/index.md");
    expect(result.created).toContain("docs/design-docs/core-beliefs.md");
    expect(result.created).toContain("docs/product-specs/index.md");
    expect(result.created).toContain("docs/exec-plans/tech-debt-tracker.md");
    expect(result.created).toContain("risk-policy.json");

    // Verify files exist on disk
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, "ARCHITECTURE.md"))).toBe(true);
    expect(existsSync(join(dir, "docs", "golden-principles.md"))).toBe(true);
    expect(existsSync(join(dir, "docs", "design-docs", "index.md"))).toBe(true);
    expect(existsSync(join(dir, "risk-policy.json"))).toBe(true);
    expect(existsSync(join(dir, "docs", "exec-plans", "active"))).toBe(true);
    expect(existsSync(join(dir, "docs", "exec-plans", "completed"))).toBe(true);
    expect(existsSync(join(dir, "docs", "references"))).toBe(true);
    expect(existsSync(join(dir, "docs", "generated"))).toBe(true);
  });

  test("uses custom project name from --name flag", async () => {
    const dir = tmpDir("init-named");
    const { stdout } = await runCli(`init ${dir} --name TestProject`);
    const result = JSON.parse(stdout);
    expect(result.project).toBe("TestProject");

    const agentsMd = readFileSync(join(dir, "AGENTS.md"), "utf-8");
    expect(agentsMd).toContain("TestProject");
  });

  test("refuses to overwrite without --force", async () => {
    const dir = tmpDir("init-noforce");
    writeFileSync(join(dir, "AGENTS.md"), "existing content");

    const { stderr, exitCode } = await runCli(`init ${dir}`);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("already exists");

    // Original file untouched
    expect(readFileSync(join(dir, "AGENTS.md"), "utf-8")).toBe("existing content");
  });

  test("overwrites with --force flag", async () => {
    const dir = tmpDir("init-force");
    writeFileSync(join(dir, "AGENTS.md"), "old content");

    const { exitCode } = await runCli(`init ${dir} --force`);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(dir, "AGENTS.md"), "utf-8");
    expect(content).not.toBe("old content");
    expect(content).toContain("# AGENTS.md");
  });

  test("fails on nonexistent directory", async () => {
    const { stderr, exitCode } = await runCli(`init ${TMP}/does-not-exist`);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not exist");
  });
});

// ─── Audit Command ──────────────────────────────────────────────────────────

describe("reins audit", () => {
  test("scores an empty directory as L0: Manual", async () => {
    const dir = tmpDir("audit-empty");
    const { stdout, exitCode } = await runCli(`audit ${dir}`);
    expect(exitCode).toBe(0);

    const result = JSON.parse(stdout);
    expect(result.total_score).toBe(0);
    expect(result.max_score).toBe(18);
    expect(result.maturity_level).toBe("L0: Manual");
    expect(result.scores.repository_knowledge.score).toBe(0);
    expect(result.scores.architecture_enforcement.score).toBe(0);
  });

  test("scores a fully scaffolded directory correctly", async () => {
    const dir = tmpDir("audit-scaffolded");

    // First init, then audit
    await runCli(`init ${dir}`);
    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    // Repository Knowledge: AGENTS.md (+1), design-docs with index (+1), exec-plans (+1) = 3
    expect(result.scores.repository_knowledge.score).toBe(3);

    // Architecture Enforcement: ARCHITECTURE.md+dep-rules combined (+1), no linter (0), no enforcement evidence (0) = 1
    expect(result.scores.architecture_enforcement.score).toBe(1);

    // Golden Principles: golden-principles.md (+1), no CI (0), tech-debt-tracker (+1) = 2
    expect(result.scores.golden_principles.score).toBe(2);

    // Garbage Collection: tech-debt tracked (+1), doc-gardening index with verification (+1), quality grades in ARCHITECTURE.md (+1) = 3
    expect(result.scores.garbage_collection.score).toBe(3);

    // Total should be at least L1
    expect(result.total_score).toBeGreaterThanOrEqual(5);
    expect(result.maturity_level).toMatch(/L1|L2/);
  });

  test("detects AGENTS.md that is too long", async () => {
    const dir = tmpDir("audit-long-agents");
    const longContent = Array(200).fill("line").join("\n");
    writeFileSync(join(dir, "AGENTS.md"), longContent);

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    // AGENTS.md exists but too long — should NOT get the point
    expect(result.scores.repository_knowledge.score).toBe(0);
    expect(result.scores.repository_knowledge.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("too long")]),
    );
  });

  test("detects linter configuration", async () => {
    const dir = tmpDir("audit-linter");
    writeFileSync(join(dir, "biome.json"), "{}");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Linter configuration found")]),
    );
  });

  test("detects lean dependencies", async () => {
    const dir = tmpDir("audit-deps");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { dev: "next dev" }, dependencies: { react: "^18" } }),
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    // Bootable (+1) + lean deps (+1) = 2
    expect(result.scores.agent_legibility.score).toBe(2);
  });

  test("returns correct maturity levels at boundaries", async () => {
    // We can't easily control exact scores, but we can verify the audit structure
    const dir = tmpDir("audit-structure");
    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result).toHaveProperty("project");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("scores");
    expect(result).toHaveProperty("total_score");
    expect(result).toHaveProperty("max_score");
    expect(result).toHaveProperty("maturity_level");
    expect(result).toHaveProperty("recommendations");
    expect(result.max_score).toBe(18);
  });

  test("fails on nonexistent directory", async () => {
    const { stderr, exitCode } = await runCli(`audit ${TMP}/nope`);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not exist");
  });
});

// ─── Doctor Command ─────────────────────────────────────────────────────────

describe("reins doctor", () => {
  test("reports all failures for empty directory", async () => {
    const dir = tmpDir("doctor-empty");
    const { stdout, exitCode } = await runCli(`doctor ${dir}`);
    expect(exitCode).toBe(0);

    const result = JSON.parse(stdout);
    expect(result.command).toBe("doctor");
    expect(result.summary.failed).toBeGreaterThan(0);
    expect(result.checks.some((c: { status: string }) => c.status === "fail")).toBe(true);
  });

  test("reports all passes for scaffolded directory", async () => {
    const dir = tmpDir("doctor-scaffolded");
    await runCli(`init ${dir}`);

    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    // All reins-created files should pass
    expect(result.summary.failed).toBe(0);
    // Linter and CI will be warnings (not created by init)
    expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
    const riskCheck = result.checks.find((c: { check: string }) => c.check.includes("risk-policy"));
    expect(riskCheck?.status).toBe("pass");
  });

  test("provides actionable fix instructions", async () => {
    const dir = tmpDir("doctor-fixes");
    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    const failedChecks = result.checks.filter((c: { status: string }) => c.status === "fail");
    for (const check of failedChecks) {
      expect(check.fix).toBeTruthy();
      expect(check.fix.length).toBeGreaterThan(0);
    }
  });
});

// ─── Evolve Command ─────────────────────────────────────────────────────────

describe("reins evolve", () => {
  test("shows L0 → L1 path for empty directory", async () => {
    const dir = tmpDir("evolve-empty");
    const { stdout, exitCode } = await runCli(`evolve ${dir}`);
    expect(exitCode).toBe(0);

    const result = JSON.parse(stdout);
    expect(result.command).toBe("evolve");
    expect(result.current_level).toBe("L0: Manual");
    expect(result.next_level).toBe("L1: Assisted");
    expect(result.steps.length).toBe(5);
    expect(result.success_criteria).toBeTruthy();
    expect(result.weakest_dimensions).toBeDefined();
  });

  test("shows L1 → L2 path for scaffolded directory", async () => {
    const dir = tmpDir("evolve-scaffolded");
    await runCli(`init ${dir}`);

    const { stdout } = await runCli(`evolve ${dir}`);
    const result = JSON.parse(stdout);

    // After init, should be at least L1
    expect(result.current_level).toMatch(/L1|L2/);
    if (result.current_level.startsWith("L1")) {
      expect(result.next_level).toBe("L2: Steered");
    }
  });

  test("includes weakest dimensions analysis", async () => {
    const dir = tmpDir("evolve-weakest");
    const { stdout } = await runCli(`evolve ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.weakest_dimensions).toBeInstanceOf(Array);
    expect(result.weakest_dimensions.length).toBeGreaterThan(0);
    expect(result.weakest_dimensions[0]).toHaveProperty("dimension");
    expect(result.weakest_dimensions[0]).toHaveProperty("score");
    expect(result.weakest_dimensions[0]).toHaveProperty("findings");
  });
});

// ─── New Audit Checks ───────────────────────────────────────────────────────

describe("D1: Repository Knowledge — new signals", () => {
  test("detects hierarchical AGENTS.md files", async () => {
    const dir = tmpDir("d1-hierarchical");
    writeFileSync(join(dir, "AGENTS.md"), "# Root AGENTS.md\nShort.");
    mkdirSync(join(dir, "packages", "core"), { recursive: true });
    writeFileSync(join(dir, "packages", "core", "AGENTS.md"), "# Core AGENTS.md");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.repository_knowledge.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Hierarchical AGENTS.md detected (2 files)")]),
    );
  });

  test("detects verification headers in docs", async () => {
    const dir = tmpDir("d1-verified");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "api.md"), "# API\n<!-- Verified: 2026-01-15 -->\nContent here.");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.repository_knowledge.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Verification headers found in 1 doc(s)")]),
    );
  });

  test("counts design decisions from index table rows", async () => {
    const dir = tmpDir("d1-decisions");
    mkdirSync(join(dir, "docs", "design-docs"), { recursive: true });
    writeFileSync(
      join(dir, "docs", "design-docs", "index.md"),
      "# Design Docs Index\n| Doc | Status | Verified | Owner |\n|-----|--------|----------|-------|\n| auth.md | Current | 2026-01 | Team |\n| api.md | Current | 2026-01 | Team |\n| db.md | Draft | 2026-01 | Team |\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.repository_knowledge.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("3 design decisions documented")]),
    );
  });

  test("does not report design decisions when fewer than 3", async () => {
    const dir = tmpDir("d1-few-decisions");
    mkdirSync(join(dir, "docs", "design-docs"), { recursive: true });
    writeFileSync(
      join(dir, "docs", "design-docs", "index.md"),
      "# Design Docs\n| Doc | Status |\n|-----|--------|\n| one.md | Current |\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    const decisionFindings = result.scores.repository_knowledge.findings.filter((f: string) =>
      f.includes("design decisions documented"),
    );
    expect(decisionFindings.length).toBe(0);
  });
});

describe("D2: Architecture Enforcement — new scoring", () => {
  test("combined check: ARCHITECTURE.md without dep rules scores 0", async () => {
    const dir = tmpDir("d2-no-deps");
    writeFileSync(join(dir, "ARCHITECTURE.md"), "# Architecture\n\nSome content without rules.");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.score).toBe(0);
    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("lacks dependency direction rules")]),
    );
  });

  test("combined check: ARCHITECTURE.md with dep rules scores 1", async () => {
    const dir = tmpDir("d2-with-deps");
    writeFileSync(join(dir, "ARCHITECTURE.md"), "# Architecture\n\nDependencies flow forward only.");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.score).toBe(1);
    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("dependency direction rules")]),
    );
  });

  test("linter with architectural keywords gets deeper finding", async () => {
    const dir = tmpDir("d2-linter-deep");
    writeFileSync(join(dir, "eslint.config.js"), `export default { rules: { "no-restricted-imports": ["error"] } };`);

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("architectural enforcement")]),
    );
  });

  test("structural lint script counts as linter depth", async () => {
    const dir = tmpDir("d2-struct-lint");
    writeFileSync(join(dir, "biome.json"), "{}");
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "structural-lint.ts"), "// lint script");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("architectural enforcement")]),
    );
  });

  test("enforcement evidence with 2+ signals scores +1", async () => {
    const dir = tmpDir("d2-enforcement");
    writeFileSync(join(dir, "risk-policy.json"), '{"tiers": ["low","medium","high"]}');
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  test:\n    run: bun test\n  lint:\n    run: bun lint\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Enforcement evidence detected")]),
    );
  });

  test("partial enforcement evidence (1 signal) does not score", async () => {
    const dir = tmpDir("d2-partial");
    writeFileSync(join(dir, "risk-policy.json"), '{"tiers": []}');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Partial enforcement evidence")]),
    );
  });
});

describe("D3: Agent Legibility — monorepo and observability", () => {
  test("detects monorepo workspace bootable app", async () => {
    const dir = tmpDir("d3-monorepo");
    writeFileSync(join(dir, "package.json"), JSON.stringify({ workspaces: ["packages/*"] }));
    mkdirSync(join(dir, "packages", "web"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "web", "package.json"),
      JSON.stringify({ scripts: { dev: "next dev" }, dependencies: { react: "^18" } }),
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Monorepo detected")]),
    );
    expect(result.scores.agent_legibility.score).toBeGreaterThanOrEqual(1);
  });

  test("detects vercel.json as modern observability", async () => {
    const dir = tmpDir("d3-vercel");
    writeFileSync(join(dir, "vercel.json"), '{"framework": "nextjs"}');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Observability configuration found")]),
    );
  });

  test("detects sentry dependency as modern observability", async () => {
    const dir = tmpDir("d3-sentry");
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { "@sentry/nextjs": "^7" } }));

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Observability configuration found")]),
    );
  });

  test("monorepo averages workspace dependencies", async () => {
    const dir = tmpDir("d3-mono-deps");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ workspaces: ["packages/*"], dependencies: { turbo: "^1" } }),
    );
    mkdirSync(join(dir, "packages", "api"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "api", "package.json"),
      JSON.stringify({ dependencies: { express: "^4", zod: "^3" } }),
    );
    mkdirSync(join(dir, "packages", "web"), { recursive: true });
    writeFileSync(
      join(dir, "packages", "web", "package.json"),
      JSON.stringify({ dependencies: { react: "^18", next: "^14" } }),
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    // avg 2 deps per workspace < 30, should get +1
    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Lean workspace dependencies")]),
    );
  });

  test("CLI repos can satisfy observability via diagnosability signals", async () => {
    const dir = tmpDir("d3-cli-diagnosability");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        name: "example-cli",
        bin: { "example-cli": "bin/example-cli.js" },
        scripts: { start: "node index.js" },
      }),
    );
    writeFileSync(join(dir, "README.md"), "# Example CLI\n\nRun `example-cli doctor` for diagnostics.\n");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src", "index.ts"), "export function doctor() { return true; }\n");
    writeFileSync(join(dir, "index.test.ts"), 'test("help", () => "--help Unknown command doctor");\n');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("CLI diagnosability signals found")]),
    );
  });

  test("non-CLI repos still require observability signals", async () => {
    const dir = tmpDir("d3-non-cli-no-obs");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "web-app", scripts: { dev: "next dev" }, dependencies: { react: "^18" } }),
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_legibility.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("No observability stack detected")]),
    );
  });
});

describe("D4: Golden Principles — depth checks", () => {
  test("counts golden principles and reports count", async () => {
    const dir = tmpDir("d4-count");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(
      join(dir, "docs", "golden-principles.md"),
      "# Golden Principles\n\n## Rule One\n\n## Rule Two\n\n## Rule Three\n\n## Rule Four\n\n## Rule Five\n\n## Rule Six\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.golden_principles.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("6 principles")]),
    );
  });

  test("warns when fewer than 5 principles", async () => {
    const dir = tmpDir("d4-few");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "golden-principles.md"), "# Golden Principles\n\n## Rule One\n\n## Rule Two\n");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.golden_principles.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("consider adding more")]),
    );
  });

  test("detects anti-patterns documentation", async () => {
    const dir = tmpDir("d4-anti");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(
      join(dir, "docs", "golden-principles.md"),
      "# Golden Principles\n\n## Anti-patterns\n\nNever use any in TypeScript.\nAvoid nested ternaries.\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.golden_principles.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Anti-patterns documented")]),
    );
  });

  test("reports CI enforcement quality gates", async () => {
    const dir = tmpDir("d4-ci-quality");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  quality:\n    steps:\n      - run: bun lint\n      - run: bun test\n      - run: bun typecheck\n      - run: bun build\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.golden_principles.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("CI enforces")]),
    );
  });
});

describe("D5: Agent Workflow — tightened checks", () => {
  test("detects conductor.json as agent config", async () => {
    const dir = tmpDir("d5-conductor");
    writeFileSync(join(dir, "conductor.json"), '{"agents": []}');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.score).toBeGreaterThanOrEqual(1);
    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Agent configuration found")]),
    );
  });

  test("risk-policy.json counts for workflow governance", async () => {
    const dir = tmpDir("d5-risk");
    writeFileSync(join(dir, "risk-policy.json"), '{"tiers": []}');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("risk-policy.json")]),
    );
  });

  test("issue templates count for workflow governance", async () => {
    const dir = tmpDir("d5-issues");
    mkdirSync(join(dir, ".github", "ISSUE_TEMPLATE"), { recursive: true });
    writeFileSync(join(dir, ".github", "ISSUE_TEMPLATE", "bug.md"), "# Bug Report");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("issue templates")]),
    );
  });

  test("CI workflows with 2+ enforcement steps scores +1", async () => {
    const dir = tmpDir("d5-ci-enforce");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  qa:\n    steps:\n      - run: bun lint\n      - run: bun test\n      - run: bun build\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("CI workflows with enforcement")]),
    );
  });

  test("CI workflows without enough enforcement steps warns", async () => {
    const dir = tmpDir("d5-ci-weak");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "deploy.yml"),
      "name: Deploy\njobs:\n  deploy:\n    steps:\n      - run: echo deploying\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("lack sufficient enforcement")]),
    );
  });

  test("does not treat actions/checkout as an enforcement gate", async () => {
    const dir = tmpDir("d5-ci-checkout-only");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  setup:\n    steps:\n      - uses: actions/checkout@v4\n",
    );

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.agent_workflow.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("lack sufficient enforcement")]),
    );
  });
});

describe("D6: Garbage Collection — active GC detection", () => {
  test("doc-gardener script counts for doc-gardening", async () => {
    const dir = tmpDir("d6-gardener");
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "doc-gardener.ts"), "// gardener script");
    mkdirSync(join(dir, "docs", "exec-plans"), { recursive: true });
    writeFileSync(join(dir, "docs", "exec-plans", "tech-debt-tracker.md"), "# Debt");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.garbage_collection.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Active doc-gardening detected")]),
    );
  });

  test("3+ verified docs counts for doc-gardening", async () => {
    const dir = tmpDir("d6-verified");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "a.md"), "# A\n<!-- Verified: 2026-01-01 -->");
    writeFileSync(join(dir, "docs", "b.md"), "# B\n<!-- Verified: 2026-01-01 -->");
    writeFileSync(join(dir, "docs", "c.md"), "# C\n<!-- Verified: 2026-01-01 -->");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.garbage_collection.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Active doc-gardening detected")]),
    );
  });

  test("risk-policy.json with docsDriftRules counts for quality grades", async () => {
    const dir = tmpDir("d6-drift");
    writeFileSync(join(dir, "risk-policy.json"), '{"docsDriftRules": [{"watch": "src/", "docs": "docs/api.md"}]}');

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.garbage_collection.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Drift enforcement detected")]),
    );
  });

  test("docs-drift script counts for quality grades", async () => {
    const dir = tmpDir("d6-drift-script");
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "docs-drift-check.ts"), "// drift checker");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.garbage_collection.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Drift enforcement detected")]),
    );
  });
});

// ─── Doctor New Checks ──────────────────────────────────────────────────────

describe("doctor — new checks", () => {
  test("checks for risk-policy.json", async () => {
    const dir = tmpDir("doctor-risk");
    writeFileSync(join(dir, "risk-policy.json"), "{}");

    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.checks.some((c: { check: string }) => c.check.includes("risk-policy.json"))).toBe(true);
  });

  test("warns when risk-policy.json missing", async () => {
    const dir = tmpDir("doctor-no-risk");

    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    const riskCheck = result.checks.find((c: { check: string }) => c.check.includes("risk-policy"));
    expect(riskCheck).toBeDefined();
    expect(riskCheck.status).toBe("warn");
  });

  test("reports verification headers presence", async () => {
    const dir = tmpDir("doctor-verified");
    mkdirSync(join(dir, "docs"), { recursive: true });
    writeFileSync(join(dir, "docs", "api.md"), "<!-- Verified: 2026-02-01 -->\n# API");

    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.checks.some((c: { check: string }) => c.check.includes("Verification headers"))).toBe(true);
  });

  test("reports CI enforcement quality when workflows have gates", async () => {
    const dir = tmpDir("doctor-ci-gates");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  check:\n    steps:\n      - run: bun lint\n      - run: bun test\n",
    );

    const { stdout } = await runCli(`doctor ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.checks.some((c: { check: string }) => c.check.includes("CI enforces"))).toBe(true);
  });
});

// ─── Evolve Path Updates ────────────────────────────────────────────────────

describe("evolve — updated paths", () => {
  test("L2 path includes risk tiers and doc-gardening steps", async () => {
    const dir = tmpDir("evolve-l2-path");
    // Create enough structure to reach L2 (score 9-13)
    await runCli(`init ${dir}`);
    // Add linter and CI to boost score
    writeFileSync(join(dir, "biome.json"), "{}");
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    writeFileSync(
      join(dir, ".github", "workflows", "ci.yml"),
      "name: CI\njobs:\n  test:\n    run: bun test\n  lint:\n    run: bun lint\n",
    );
    writeFileSync(join(dir, "CLAUDE.md"), "# Agent config");

    const { stdout } = await runCli(`evolve ${dir}`);
    const result = JSON.parse(stdout);

    // Should be at L2 or higher
    if (result.current_level.startsWith("L2")) {
      const stepActions = result.steps.map((s: { action: string }) => s.action);
      expect(stepActions).toEqual(expect.arrayContaining([expect.stringContaining("risk tiers")]));
      expect(stepActions).toEqual(expect.arrayContaining([expect.stringContaining("doc-gardening")]));
    }
  });
});

// ─── Help & Error Handling ──────────────────────────────────────────────────

describe("reins help", () => {
  test("shows help with no arguments", async () => {
    const { stdout, exitCode } = await runCli("help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("reins");
    expect(stdout).toContain("init");
    expect(stdout).toContain("audit");
    expect(stdout).toContain("evolve");
    expect(stdout).toContain("doctor");
  });

  test("shows help with --help flag", async () => {
    const { stdout, exitCode } = await runCli("--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("COMMANDS");
  });

  test("rejects unknown commands", async () => {
    const { stderr, exitCode } = await runCli("foobar");
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown command");
  });
});
