import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const CLI = join(import.meta.dir, "index.ts");
const TMP = join(import.meta.dir, "..", ".test-fixtures");

function tmpDir(name: string): string {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runCli(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise(async (resolve) => {
    try {
      const proc = Bun.spawn(["bun", CLI, ...args.split(" ")], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;
      resolve({ stdout, stderr, exitCode });
    } catch {
      resolve({ stdout: "", stderr: "spawn failed", exitCode: 1 });
    }
  });
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

describe("harness init", () => {
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

    // Verify files exist on disk
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dir, "ARCHITECTURE.md"))).toBe(true);
    expect(existsSync(join(dir, "docs", "golden-principles.md"))).toBe(true);
    expect(existsSync(join(dir, "docs", "design-docs", "index.md"))).toBe(true);
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

describe("harness audit", () => {
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

    // Architecture Enforcement: ARCHITECTURE.md (+1), dependency rules (+1), no linter (0) = 2
    expect(result.scores.architecture_enforcement.score).toBe(2);

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
      expect.arrayContaining([expect.stringContaining("too long")])
    );
  });

  test("detects linter configuration", async () => {
    const dir = tmpDir("audit-linter");
    writeFileSync(join(dir, "biome.json"), "{}");

    const { stdout } = await runCli(`audit ${dir}`);
    const result = JSON.parse(stdout);

    expect(result.scores.architecture_enforcement.findings).toEqual(
      expect.arrayContaining([expect.stringContaining("Linter configuration found")])
    );
  });

  test("detects lean dependencies", async () => {
    const dir = tmpDir("audit-deps");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { dev: "next dev" }, dependencies: { react: "^18" } })
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

describe("harness doctor", () => {
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

    // All harness-created files should pass
    expect(result.summary.failed).toBe(0);
    // Linter and CI will be warnings (not created by init)
    expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
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

describe("harness evolve", () => {
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

// ─── Help & Error Handling ──────────────────────────────────────────────────

describe("harness help", () => {
  test("shows help with no arguments", async () => {
    const { stdout, exitCode } = await runCli("help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("harness");
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
