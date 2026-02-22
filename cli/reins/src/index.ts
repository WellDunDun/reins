#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve, basename } from "path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditScore {
  score: number;
  max: number;
  findings: string[];
}

interface AuditResult {
  project: string;
  timestamp: string;
  scores: {
    repository_knowledge: AuditScore;
    architecture_enforcement: AuditScore;
    agent_legibility: AuditScore;
    golden_principles: AuditScore;
    agent_workflow: AuditScore;
    garbage_collection: AuditScore;
  };
  total_score: number;
  max_score: 18;
  maturity_level: string;
  recommendations: string[];
}

interface InitOptions {
  path: string;
  name: string;
  force: boolean;
}

// ─── Templates ──────────────────────────────────────────────────────────────

function agentsMdTemplate(projectName: string): string {
  return `# AGENTS.md

## Repository Overview

${projectName} — [Brief description of the project].

## Architecture

See ARCHITECTURE.md for domain map, package layering, and dependency rules.

## Documentation Map

| Topic | Location | Status |
|-------|----------|--------|
| Architecture | ARCHITECTURE.md | Current |
| Design Docs | docs/design-docs/index.md | Current |
| Core Beliefs | docs/design-docs/core-beliefs.md | Current |
| Product Specs | docs/product-specs/index.md | Current |
| Active Plans | docs/exec-plans/active/ | Current |
| Completed Plans | docs/exec-plans/completed/ | Current |
| Technical Debt | docs/exec-plans/tech-debt-tracker.md | Current |
| Golden Principles | docs/golden-principles.md | Current |
| References | docs/references/ | Current |

## Development Workflow

1. Receive task via prompt
2. Read this file, then follow pointers to relevant docs
3. Implement changes following ARCHITECTURE.md layer rules
4. Run linters and structural tests (\`bun run lint && bun run test\`)
5. Self-review changes for correctness and style
6. Request agent review if available
7. Iterate until all reviewers satisfied
8. Open PR with concise summary

## Key Constraints

- Dependencies flow forward only: Types > Config > Repo > Service > Runtime > UI
- Cross-cutting concerns enter ONLY through Providers
- Validate data at boundaries — never probe shapes without validation
- Prefer shared utilities over hand-rolled helpers
- All knowledge lives in-repo, not in external tools

## Golden Principles

See docs/golden-principles.md for the full set of mechanical taste rules.
`;
}

function architectureMdTemplate(projectName: string): string {
  return `# Architecture — ${projectName}

## Domain Map

<!-- List your business domains here. Each domain follows the layered architecture. -->

| Domain | Description | Quality Grade |
|--------|-------------|---------------|
| Core | Core business logic | — |
| Auth | Authentication and authorization | — |
| UI | User interface components | — |

## Layered Architecture

Each domain follows a strict layer ordering. Dependencies flow forward only.

\`\`\`
Utils
  |
  v
Business Domain
  +-- Types --> Config --> Repo --> Service --> Runtime --> UI
  |
  +-- Providers (cross-cutting: auth, connectors, telemetry, feature flags)
        |
        v
      App Wiring + UI
\`\`\`

### Layer Definitions

| Layer | Responsibility | May Import From |
|-------|---------------|-----------------|
| Types | Data shapes, enums, interfaces | Utils |
| Config | Configuration loading, validation | Types, Utils |
| Repo | Data access, storage | Config, Types, Utils |
| Service | Business logic orchestration | Repo, Config, Types, Utils |
| Runtime | Process lifecycle, scheduling | Service, Config, Types, Utils |
| UI | User-facing presentation | Runtime, Service, Types, Utils |
| Providers | Cross-cutting adapters | Any layer (explicit interface) |

### Enforcement

These rules are enforced mechanically:
- [ ] Custom linter for import direction (TODO: implement)
- [ ] Structural tests for layer violations (TODO: implement)
- [ ] CI gate that fails on violations (TODO: implement)

## Package Structure

\`\`\`
src/
  domains/
    [domain-name]/
      types/
      config/
      repo/
      service/
      runtime/
      ui/
      providers/
  utils/
  shared/
\`\`\`
`;
}

function goldenPrinciplesTemplate(): string {
  return `# Golden Principles

Opinionated mechanical rules that encode human taste. These go beyond standard linters and are enforced in CI.

## Structural Rules

1. **Shared utilities over hand-rolled helpers**
   Centralize invariants in shared packages. Never duplicate utility logic across domains.

2. **Validate at boundaries, never YOLO**
   Parse and validate all external data at system boundaries. Use typed SDKs. Never access unvalidated shapes.

3. **Boring technology preferred**
   Choose composable, stable, well-documented dependencies. Prefer libraries well-represented in LLM training data. Reimplement simple utilities rather than pulling opaque dependencies.

4. **Single source of truth**
   Every piece of knowledge has exactly one canonical location. If it's duplicated, one copy is a reference to the other.

## Naming Conventions

- Files: kebab-case (\`user-service.ts\`)
- Types/Interfaces: PascalCase (\`UserProfile\`)
- Functions/Variables: camelCase (\`getUserProfile\`)
- Constants: SCREAMING_SNAKE_CASE (\`MAX_RETRY_COUNT\`)
- Domains: kebab-case directories (\`app-settings/\`)

## Code Style

- Prefer explicit over implicit
- No magic strings — use enums or constants
- Error messages must be actionable (what happened, what to do)
- Functions do one thing
- No nested ternaries
- Prefer early returns over deep nesting

## Testing Rules

- Every public function has at least one test
- Tests are co-located with source (\`*.test.ts\` next to \`*.ts\`)
- Test names describe the expected state, not the action
- No test interdependence — each test is isolated

## Documentation Rules

- Every design decision is documented with rationale
- Docs are verified against code on a recurring cadence
- Stale docs are worse than no docs — delete or update

## Review Rules

- Agent reviews check: layer violations, golden principle adherence, test coverage
- Human reviews focus on: intent alignment, architectural fit, user impact
- Nit-level feedback is captured as golden principle updates, not blocking comments
`;
}

function coreBeliefsTemplate(): string {
  return `# Core Beliefs

Agent-first operating principles that guide all development decisions.

## 1. Repository is the Single Source of Truth

If it's not in the repo, it doesn't exist to the agent. Slack discussions, meeting notes, and tribal knowledge must be captured in versioned markdown.

## 2. Agents Are First-Class Team Members

Design docs, architecture guides, and workflows are written for agent consumption first. Human readability is a bonus, not the goal.

## 3. Constraints Enable Speed

Strict architectural rules, enforced mechanically, allow agents to ship fast without creating drift. Freedom within boundaries.

## 4. Corrections Are Cheap

In a high-throughput agent environment, fixing forward is usually cheaper than blocking. Optimize for flow, not perfection at merge time.

## 5. Taste Is Captured Once, Enforced Continuously

Human engineering judgment is encoded into golden principles and tooling, then applied to every line of code automatically. Taste doesn't scale through review — it scales through automation.

## 6. Technical Debt Is a High-Interest Loan

Pay it down continuously in small increments. Background agents handle cleanup. Never let it compound.

## 7. Progressive Disclosure Over Information Dumps

Give agents a map (short AGENTS.md) and teach them where to look. Don't overwhelm context with everything at once.
`;
}

function techDebtTrackerTemplate(): string {
  return `# Technical Debt Tracker

Track known technical debt with priority and ownership.

| ID | Description | Domain | Priority | Status | Created | Updated |
|----|-------------|--------|----------|--------|---------|---------|
| TD-001 | Example: implement dependency linter | Core | High | Open | ${new Date().toISOString().split("T")[0]} | ${new Date().toISOString().split("T")[0]} |

## Priority Definitions

- **Critical**: Actively causing bugs or blocking features
- **High**: Will cause problems soon, should address this sprint
- **Medium**: Noticeable drag on velocity, schedule for cleanup
- **Low**: Minor annoyance, address opportunistically

## Process

1. New debt discovered → add row here
2. Background agents scan weekly for new debt
3. Cleanup PRs opened targeting highest priority items
4. Resolved debt marked as "Closed" with resolution date
`;
}

function designDocsIndexTemplate(): string {
  return `# Design Documents Index

Registry of all design documents with verification status.

| Document | Status | Last Verified | Owner |
|----------|--------|---------------|-------|
| core-beliefs.md | Current | ${new Date().toISOString().split("T")[0]} | Team |

## Verification Schedule

Design docs are verified against the actual codebase on a recurring cadence:
- **Weekly**: Active design docs for in-progress features
- **Monthly**: All design docs
- **On change**: When related code is significantly modified

## Status Definitions

- **Current**: Verified to match actual implementation
- **Stale**: Known to be out of date, needs update
- **Draft**: In progress, not yet finalized
- **Archived**: No longer relevant, kept for historical reference
`;
}

function productSpecsIndexTemplate(): string {
  return `# Product Specifications Index

Registry of all product specifications.

| Spec | Status | Priority | Owner |
|------|--------|----------|-------|
| — | — | — | — |

## Adding a New Spec

1. Create a new markdown file in this directory
2. Add it to the table above
3. Include: problem statement, proposed solution, acceptance criteria, out of scope
4. Link related design docs and execution plans
`;
}

// ─── Commands ───────────────────────────────────────────────────────────────

function init(options: InitOptions): void {
  const targetDir = resolve(options.path);
  const projectName = options.name || basename(targetDir);

  if (!existsSync(targetDir)) {
    console.error(JSON.stringify({ error: `Directory does not exist: ${targetDir}` }));
    process.exit(1);
  }

  const agentsMdPath = join(targetDir, "AGENTS.md");
  if (existsSync(agentsMdPath) && !options.force) {
    console.error(
      JSON.stringify({
        error: "AGENTS.md already exists. Use --force to overwrite.",
        hint: "Run 'reins audit' to assess your current setup instead.",
      })
    );
    process.exit(1);
  }

  const created: string[] = [];

  // Create directories
  const dirs = [
    "docs/design-docs",
    "docs/exec-plans/active",
    "docs/exec-plans/completed",
    "docs/generated",
    "docs/product-specs",
    "docs/references",
  ];

  for (const dir of dirs) {
    const fullPath = join(targetDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      created.push(dir + "/");
    }
  }

  // Create files
  const files: Array<{ path: string; content: string }> = [
    { path: "AGENTS.md", content: agentsMdTemplate(projectName) },
    { path: "ARCHITECTURE.md", content: architectureMdTemplate(projectName) },
    { path: "docs/golden-principles.md", content: goldenPrinciplesTemplate() },
    { path: "docs/design-docs/index.md", content: designDocsIndexTemplate() },
    { path: "docs/design-docs/core-beliefs.md", content: coreBeliefsTemplate() },
    { path: "docs/product-specs/index.md", content: productSpecsIndexTemplate() },
    { path: "docs/exec-plans/tech-debt-tracker.md", content: techDebtTrackerTemplate() },
  ];

  for (const file of files) {
    const fullPath = join(targetDir, file.path);
    if (!existsSync(fullPath) || options.force) {
      writeFileSync(fullPath, file.content);
      created.push(file.path);
    }
  }

  console.log(
    JSON.stringify(
      {
        command: "init",
        project: projectName,
        target: targetDir,
        created,
        next_steps: [
          "Edit AGENTS.md — fill in the project description",
          "Edit ARCHITECTURE.md — define your business domains",
          "Edit docs/golden-principles.md — customize rules for your project",
          "Run 'reins audit .' to see your starting score",
        ],
      },
      null,
      2
    )
  );
}

function runAudit(targetPath: string): AuditResult {
  const targetDir = resolve(targetPath);

  if (!existsSync(targetDir)) {
    throw new Error(`Directory does not exist: ${targetDir}`);
  }

  const projectName = basename(targetDir);

  const result: AuditResult = {
    project: projectName,
    timestamp: new Date().toISOString(),
    scores: {
      repository_knowledge: { score: 0, max: 3, findings: [] },
      architecture_enforcement: { score: 0, max: 3, findings: [] },
      agent_legibility: { score: 0, max: 3, findings: [] },
      golden_principles: { score: 0, max: 3, findings: [] },
      agent_workflow: { score: 0, max: 3, findings: [] },
      garbage_collection: { score: 0, max: 3, findings: [] },
    },
    total_score: 0,
    max_score: 18,
    maturity_level: "L0",
    recommendations: [],
  };

  // ── Repository Knowledge ──────────────────────────────────────────────

  const agentsMd = join(targetDir, "AGENTS.md");
  if (existsSync(agentsMd)) {
    const content = readFileSync(agentsMd, "utf-8");
    const lines = content.split("\n").length;
    if (lines <= 150) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push(`AGENTS.md exists (${lines} lines)`);
    } else {
      result.scores.repository_knowledge.findings.push(
        `AGENTS.md exists but too long (${lines} lines, target: <150)`
      );
    }
  } else {
    result.scores.repository_knowledge.findings.push("AGENTS.md missing");
    result.recommendations.push("Create AGENTS.md as a concise map (~100 lines) — run 'reins init .'");
  }

  const docsDir = join(targetDir, "docs");
  if (existsSync(docsDir)) {
    const hasDesignDocs = existsSync(join(docsDir, "design-docs"));
    const hasIndex = existsSync(join(docsDir, "design-docs", "index.md"));
    if (hasDesignDocs && hasIndex) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push("docs/design-docs/ with index exists");
    } else if (hasDesignDocs) {
      result.scores.repository_knowledge.findings.push("docs/design-docs/ exists but missing index.md");
    } else {
      result.scores.repository_knowledge.findings.push("docs/design-docs/ missing");
    }
  } else {
    result.scores.repository_knowledge.findings.push("docs/ directory missing");
    result.recommendations.push("Create docs/ directory structure — run 'reins init .'");
  }

  const execPlans = join(targetDir, "docs", "exec-plans");
  if (existsSync(execPlans)) {
    const hasActive = existsSync(join(execPlans, "active"));
    const hasCompleted = existsSync(join(execPlans, "completed"));
    if (hasActive && hasCompleted) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push("Execution plans versioned in-repo");
    } else {
      result.scores.repository_knowledge.findings.push("exec-plans/ incomplete (missing active/ or completed/)");
    }
  } else {
    result.scores.repository_knowledge.findings.push("No versioned execution plans");
  }

  // ── Architecture Enforcement ──────────────────────────────────────────

  const archMd = join(targetDir, "ARCHITECTURE.md");
  if (existsSync(archMd)) {
    const content = readFileSync(archMd, "utf-8");
    result.scores.architecture_enforcement.score++;
    result.scores.architecture_enforcement.findings.push("ARCHITECTURE.md exists");

    if (/dependenc|layer|forward only|import/i.test(content)) {
      result.scores.architecture_enforcement.score++;
      result.scores.architecture_enforcement.findings.push("Dependency direction rules documented");
    } else {
      result.scores.architecture_enforcement.findings.push(
        "ARCHITECTURE.md lacks dependency direction rules"
      );
      result.recommendations.push("Document dependency direction rules in ARCHITECTURE.md");
    }
  } else {
    result.scores.architecture_enforcement.findings.push("ARCHITECTURE.md missing");
    result.recommendations.push("Create ARCHITECTURE.md with domain map and layer rules");
  }

  // Check for mechanical enforcement (linters, structural tests)
  const hasEslint =
    existsSync(join(targetDir, ".eslintrc.json")) ||
    existsSync(join(targetDir, ".eslintrc.js")) ||
    existsSync(join(targetDir, "eslint.config.js")) ||
    existsSync(join(targetDir, "eslint.config.mjs"));
  const hasBiome = existsSync(join(targetDir, "biome.json"));

  if (hasEslint || hasBiome) {
    result.scores.architecture_enforcement.score++;
    result.scores.architecture_enforcement.findings.push("Linter configuration found");
  } else {
    result.scores.architecture_enforcement.findings.push("No linter configuration found");
    result.recommendations.push("Add linter configuration to enforce architectural constraints");
  }

  // ── Agent Legibility ──────────────────────────────────────────────────

  // Check if app is bootable (look for dev scripts)
  const pkgJson = join(targetDir, "package.json");
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
      if (pkg.scripts?.dev || pkg.scripts?.start) {
        result.scores.agent_legibility.score++;
        result.scores.agent_legibility.findings.push("App has dev/start script (bootable)");
      }
    } catch {
      // ignore parse errors
    }
  }

  // Check for observability config
  const obsFiles = ["docker-compose.yml", "docker-compose.yaml", "grafana", "prometheus.yml"];
  const hasObs = obsFiles.some(
    (f) => existsSync(join(targetDir, f)) || existsSync(join(targetDir, "infra", f))
  );
  if (hasObs) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push("Observability configuration found");
  } else {
    result.scores.agent_legibility.findings.push("No observability stack detected");
  }

  // Check for boring tech (heuristic: fewer dependencies = better)
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
      const depCount = Object.keys(pkg.dependencies || {}).length;
      if (depCount < 20) {
        result.scores.agent_legibility.score++;
        result.scores.agent_legibility.findings.push(
          `Lean dependency set (${depCount} dependencies)`
        );
      } else {
        result.scores.agent_legibility.findings.push(
          `Heavy dependency set (${depCount} dependencies) — consider trimming`
        );
      }
    } catch {
      // ignore
    }
  }

  // ── Golden Principles ─────────────────────────────────────────────────

  const goldenPath = join(targetDir, "docs", "golden-principles.md");
  if (existsSync(goldenPath)) {
    result.scores.golden_principles.score++;
    result.scores.golden_principles.findings.push("Golden principles documented");
  } else {
    result.scores.golden_principles.findings.push("No golden principles document");
    result.recommendations.push("Create docs/golden-principles.md with mechanical taste rules");
  }

  // Check for CI config (GitHub Actions, etc.)
  const ciPaths = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"];
  const hasCI = ciPaths.some((p) => existsSync(join(targetDir, p)));
  if (hasCI) {
    result.scores.golden_principles.score++;
    result.scores.golden_principles.findings.push("CI pipeline exists for enforcement");
  } else {
    result.scores.golden_principles.findings.push("No CI pipeline detected");
  }

  // Check for cleanup/refactoring process indicators
  const hasCleanupDocs =
    existsSync(join(targetDir, "docs", "exec-plans", "tech-debt-tracker.md"));
  if (hasCleanupDocs) {
    result.scores.golden_principles.score++;
    result.scores.golden_principles.findings.push("Tech debt tracker exists");
  }

  // ── Agent Workflow ────────────────────────────────────────────────────

  // Check for CLAUDE.md or similar agent config
  const agentConfigs = ["CLAUDE.md", ".claude", "CODEX.md", ".cursor"];
  const hasAgentConfig = agentConfigs.some((f) => existsSync(join(targetDir, f)));
  if (hasAgentConfig) {
    result.scores.agent_workflow.score++;
    result.scores.agent_workflow.findings.push("Agent configuration found");
  } else {
    result.scores.agent_workflow.findings.push("No agent configuration (CLAUDE.md, .cursor, etc.)");
  }

  // Check for PR templates
  const hasPRTemplate =
    existsSync(join(targetDir, ".github", "pull_request_template.md")) ||
    existsSync(join(targetDir, ".github", "PULL_REQUEST_TEMPLATE.md"));
  if (hasPRTemplate) {
    result.scores.agent_workflow.score++;
    result.scores.agent_workflow.findings.push("PR template exists");
  }

  // Minimal merge gates (heuristic: check branch protection presence)
  if (existsSync(join(targetDir, ".github"))) {
    result.scores.agent_workflow.score++;
    result.scores.agent_workflow.findings.push("GitHub workflow infrastructure present");
  }

  // ── Garbage Collection ────────────────────────────────────────────────

  if (hasCleanupDocs) {
    result.scores.garbage_collection.score++;
    result.scores.garbage_collection.findings.push("Tech debt tracked in-repo");
  } else {
    result.scores.garbage_collection.findings.push("No tech debt tracking");
  }

  // Check for doc-gardening indicators
  const hasDocGardening = existsSync(join(targetDir, "docs", "design-docs", "index.md"));
  if (hasDocGardening) {
    const content = readFileSync(join(targetDir, "docs", "design-docs", "index.md"), "utf-8");
    if (/verif|status|last.*check/i.test(content)) {
      result.scores.garbage_collection.score++;
      result.scores.garbage_collection.findings.push("Design docs index with verification tracking");
    }
  }

  // Check for quality grades
  if (existsSync(archMd)) {
    const content = readFileSync(archMd, "utf-8");
    if (/quality.*grade|grade/i.test(content)) {
      result.scores.garbage_collection.score++;
      result.scores.garbage_collection.findings.push("Quality grades tracked in architecture");
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────

  result.total_score = Object.values(result.scores).reduce((sum, s) => sum + s.score, 0);

  if (result.total_score <= 4) result.maturity_level = "L0: Manual";
  else if (result.total_score <= 8) result.maturity_level = "L1: Assisted";
  else if (result.total_score <= 13) result.maturity_level = "L2: Steered";
  else if (result.total_score <= 16) result.maturity_level = "L3: Autonomous";
  else result.maturity_level = "L4: Self-Correcting";

  // Fill remaining recommendations
  if (result.recommendations.length === 0) {
    result.recommendations.push("Project is well-structured. Consider evolving to next maturity level.");
  }

  return result;
}

function audit(targetPath: string): void {
  try {
    const result = runAudit(targetPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}

function doctor(targetPath: string): void {
  const targetDir = resolve(targetPath);
  const projectName = basename(targetDir);

  if (!existsSync(targetDir)) {
    console.error(JSON.stringify({ error: `Directory does not exist: ${targetDir}` }));
    process.exit(1);
  }

  const checks: Array<{ check: string; status: "pass" | "fail" | "warn"; fix: string }> = [];

  // AGENTS.md
  const agentsMd = join(targetDir, "AGENTS.md");
  if (existsSync(agentsMd)) {
    const lines = readFileSync(agentsMd, "utf-8").split("\n").length;
    if (lines <= 150) {
      checks.push({ check: "AGENTS.md exists and concise", status: "pass", fix: "" });
    } else {
      checks.push({
        check: "AGENTS.md too long",
        status: "warn",
        fix: `Trim AGENTS.md from ${lines} to ~100 lines. Move details to docs/.`,
      });
    }
  } else {
    checks.push({
      check: "AGENTS.md missing",
      status: "fail",
      fix: "Run 'reins init .' to create AGENTS.md",
    });
  }

  // ARCHITECTURE.md
  if (existsSync(join(targetDir, "ARCHITECTURE.md"))) {
    checks.push({ check: "ARCHITECTURE.md exists", status: "pass", fix: "" });
  } else {
    checks.push({
      check: "ARCHITECTURE.md missing",
      status: "fail",
      fix: "Run 'reins init .' to create ARCHITECTURE.md",
    });
  }

  // docs/ structure
  const requiredDocs = [
    "docs/design-docs/index.md",
    "docs/design-docs/core-beliefs.md",
    "docs/product-specs/index.md",
    "docs/exec-plans/tech-debt-tracker.md",
    "docs/golden-principles.md",
  ];

  for (const doc of requiredDocs) {
    if (existsSync(join(targetDir, doc))) {
      checks.push({ check: `${doc} exists`, status: "pass", fix: "" });
    } else {
      checks.push({
        check: `${doc} missing`,
        status: "fail",
        fix: `Run 'reins init .' to create missing files`,
      });
    }
  }

  // Linter
  const linterFiles = [".eslintrc.json", ".eslintrc.js", "eslint.config.js", "eslint.config.mjs", "biome.json"];
  if (linterFiles.some((f) => existsSync(join(targetDir, f)))) {
    checks.push({ check: "Linter configured", status: "pass", fix: "" });
  } else {
    checks.push({
      check: "No linter configured",
      status: "warn",
      fix: "Add eslint or biome config to enforce architectural constraints",
    });
  }

  // CI
  const ciPaths = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile"];
  if (ciPaths.some((p) => existsSync(join(targetDir, p)))) {
    checks.push({ check: "CI pipeline exists", status: "pass", fix: "" });
  } else {
    checks.push({
      check: "No CI pipeline",
      status: "warn",
      fix: "Add CI pipeline to enforce golden principles mechanically",
    });
  }

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;

  console.log(
    JSON.stringify(
      {
        command: "doctor",
        project: projectName,
        target: targetDir,
        summary: { passed, failed, warnings: warned, total: checks.length },
        checks,
      },
      null,
      2
    )
  );
}

// ─── Evolution Paths ────────────────────────────────────────────────────────

interface EvolutionStep {
  step: number;
  action: string;
  description: string;
  automated: boolean;
}

interface EvolutionPath {
  from: string;
  to: string;
  goal: string;
  steps: EvolutionStep[];
  success_criteria: string;
}

const EVOLUTION_PATHS: Record<string, EvolutionPath> = {
  "L0": {
    from: "L0: Manual",
    to: "L1: Assisted",
    goal: "Get agents into the development loop",
    steps: [
      { step: 1, action: "Create AGENTS.md", description: "Concise map (~100 lines) pointing agents to deeper docs. Run 'reins init .' to generate.", automated: true },
      { step: 2, action: "Create docs/ structure", description: "Design docs, product specs, references, execution plans — all versioned in-repo.", automated: true },
      { step: 3, action: "Document architecture", description: "ARCHITECTURE.md with domain map, layer ordering, and dependency direction rules.", automated: true },
      { step: 4, action: "Set up agent-friendly CI", description: "Fast feedback, clear error messages, deterministic output. Agents need to parse CI results.", automated: false },
      { step: 5, action: "First agent PR", description: "Have an agent open its first PR from a prompt. Validates the full loop works end-to-end.", automated: false },
    ],
    success_criteria: "Agent can read AGENTS.md, follow pointers, and open a useful PR.",
  },
  "L1": {
    from: "L1: Assisted",
    to: "L2: Steered",
    goal: "Shift from human-writes-code to human-steers-agent",
    steps: [
      { step: 1, action: "Write golden principles", description: "Mechanical taste rules in docs/golden-principles.md, enforced in CI — not just documented.", automated: true },
      { step: 2, action: "Add structural linters", description: "Custom lint rules for dependency direction, layer violations, naming conventions.", automated: false },
      { step: 3, action: "Enable worktree isolation", description: "App bootable per git worktree — one instance per in-flight change.", automated: false },
      { step: 4, action: "Create exec-plan templates", description: "Versioned execution plans in docs/exec-plans/ — active, completed, and tech debt tracked.", automated: true },
      { step: 5, action: "Adopt prompt-first workflow", description: "Describe tasks in natural language. Agents write all code, tests, and docs.", automated: false },
    ],
    success_criteria: "Most new code is written by agents, not humans.",
  },
  "L2": {
    from: "L2: Steered",
    to: "L3: Autonomous",
    goal: "Agent handles full PR lifecycle end-to-end",
    steps: [
      { step: 1, action: "Wire agent review", description: "Agent-to-agent review loops — agents review each other's PRs before human spot-check.", automated: false },
      { step: 2, action: "Add observability", description: "Logs, metrics, traces accessible to agents via local stack (LogQL, PromQL, TraceQL).", automated: false },
      { step: 3, action: "Enable self-validation", description: "Agent drives the app, takes screenshots, checks behavior against expectations.", automated: false },
      { step: 4, action: "Reduce merge gates", description: "Minimize blocking requirements. Corrections are cheap, waiting is expensive.", automated: false },
      { step: 5, action: "Build escalation paths", description: "Clear criteria for when to involve humans vs. when agents can proceed autonomously.", automated: false },
    ],
    success_criteria: "Agent can end-to-end ship a feature from prompt to merge.",
  },
  "L3": {
    from: "L3: Autonomous",
    to: "L4: Self-Correcting",
    goal: "System maintains and improves itself without human intervention",
    steps: [
      { step: 1, action: "Implement doc-gardening", description: "Recurring agent scans for stale docs — detects drift between docs and code.", automated: false },
      { step: 2, action: "Add quality grades", description: "Per-domain, per-layer scoring tracked in ARCHITECTURE.md.", automated: false },
      { step: 3, action: "Automate refactoring", description: "Background agents open cleanup PRs targeting highest-priority tech debt.", automated: false },
      { step: 4, action: "Track tech debt continuously", description: "In-repo tracker with recurring review — debt paid down in small increments.", automated: true },
      { step: 5, action: "Enable continuous improvement", description: "Human taste captured once in golden principles, enforced continuously by agents.", automated: false },
    ],
    success_criteria: "Codebase improves in quality without human intervention.",
  },
};

function evolve(targetPath: string, runInit: boolean): void {
  let auditResult: AuditResult;
  try {
    auditResult = runAudit(targetPath);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }

  // Determine current level key
  let currentKey: string;
  if (auditResult.total_score <= 4) currentKey = "L0";
  else if (auditResult.total_score <= 8) currentKey = "L1";
  else if (auditResult.total_score <= 13) currentKey = "L2";
  else if (auditResult.total_score <= 16) currentKey = "L3";
  else currentKey = "L4";

  if (currentKey === "L4") {
    console.log(
      JSON.stringify(
        {
          command: "evolve",
          project: auditResult.project,
          current_level: auditResult.maturity_level,
          current_score: auditResult.total_score,
          message: "Already at L4: Self-Correcting. Focus on maintaining quality grades and continuous improvement.",
        },
        null,
        2
      )
    );
    return;
  }

  const path = EVOLUTION_PATHS[currentKey];
  const automatedSteps = path.steps.filter((s) => s.automated);
  const manualSteps = path.steps.filter((s) => !s.automated);

  // If --apply flag is set, run automated steps
  const applied: string[] = [];
  if (runInit && automatedSteps.some((s) => s.action.includes("AGENTS.md") || s.action.includes("docs/"))) {
    const targetDir = resolve(targetPath);
    const agentsMd = join(targetDir, "AGENTS.md");
    if (!existsSync(agentsMd)) {
      init({ path: targetPath, name: "", force: false });
      applied.push("Ran 'reins init' to scaffold missing structure");
    }
  }

  // Find weakest dimensions for targeted advice
  const weakest = Object.entries(auditResult.scores)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([dim, score]) => ({ dimension: dim, score: score.score, max: score.max, findings: score.findings }));

  console.log(
    JSON.stringify(
      {
        command: "evolve",
        project: auditResult.project,
        current_level: auditResult.maturity_level,
        current_score: auditResult.total_score,
        next_level: path.to,
        goal: path.goal,
        steps: path.steps,
        success_criteria: path.success_criteria,
        weakest_dimensions: weakest,
        applied,
        recommendations: auditResult.recommendations,
      },
      null,
      2
    )
  );
}

// ─── CLI Router ─────────────────────────────────────────────────────────────

function printHelp(): void {
  const help = `reins — Harness Engineering CLI

USAGE:
  reins <command> [options]

COMMANDS:
  init <path>     Scaffold harness engineering structure in target directory
  audit <path>    Audit a project against harness engineering principles
  evolve <path>   Show evolution path to next maturity level
  doctor <path>   Check project health with prescriptive fixes
  help            Show this help message

OPTIONS:
  --name <name>   Project name (default: directory name)
  --force         Overwrite existing files
  --apply         Auto-run scaffolding steps during evolve
  --json          Force JSON output (default)

EXAMPLES:
  reins init .                    # Scaffold in current directory
  reins init ./my-project --name "My Project"
  reins audit .                   # Score current project
  reins evolve .                  # Get evolution roadmap
  reins evolve . --apply          # Evolve with auto-scaffolding
  reins doctor .                  # Get prescriptive fixes

MATURITY LEVELS:
  L0: Manual          (0-4)   Traditional engineering
  L1: Assisted        (5-8)   Agents help, humans still code
  L2: Steered         (9-13)  Humans steer, agents execute
  L3: Autonomous      (14-16) Agents handle full lifecycle
  L4: Self-Correcting (17-18) System maintains itself
`;
  console.log(help);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  // Parse flags
  const flagIndex = (flag: string) => args.indexOf(flag);
  const hasFlag = (flag: string) => args.includes(flag);
  const getFlagValue = (flag: string): string | undefined => {
    const idx = flagIndex(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  switch (command) {
    case "init": {
      const path = args[1] || ".";
      init({
        path,
        name: getFlagValue("--name") || "",
        force: hasFlag("--force"),
      });
      break;
    }
    case "audit": {
      const path = args[1] || ".";
      audit(path);
      break;
    }
    case "evolve": {
      const path = args[1] || ".";
      evolve(path, hasFlag("--apply"));
      break;
    }
    case "doctor": {
      const path = args[1] || ".";
      doctor(path);
      break;
    }
    default:
      console.error(JSON.stringify({ error: `Unknown command: ${command}`, hint: "Run 'reins help'" }));
      process.exit(1);
  }
}

main();
