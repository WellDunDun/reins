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
| Risk Policy | risk-policy.json | Current |
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

function riskPolicyTemplate(): string {
  return `{
  "version": 1,
  "tiers": ["low", "medium", "high"],
  "watchPaths": ["src/", "docs/", "skill/"],
  "docsDriftRules": [
    {
      "watch": "src/",
      "docs": ["ARCHITECTURE.md", "docs/design-docs/index.md", "docs/golden-principles.md"]
    },
    {
      "watch": "skill/",
      "docs": ["AGENTS.md", "skill/Reins/HarnessMethodology.md"]
    }
  ]
}
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function findFiles(dir: string, pattern: RegExp, maxDepth: number = 3): string[] {
  const results: string[] = [];
  function walk(current: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(current);
      for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'build', '.next', '.expo'].includes(entry)) continue;
        const full = join(current, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) walk(full, depth + 1);
          else if (pattern.test(entry)) results.push(full);
        } catch { /* skip inaccessible */ }
      }
    } catch { /* skip inaccessible */ }
  }
  walk(dir, 0);
  return results;
}

function countGoldenPrinciples(content: string): number {
  const headings = content.match(/^##\s+/gm)?.length || 0;
  const numbered = content.match(/^\d+\.\s+/gm)?.length || 0;
  return Math.max(headings, numbered);
}

function scanWorkflowsForEnforcement(workflowDir: string): string[] {
  const steps: Set<string> = new Set();
  const keywordPatterns: Array<{ step: string; pattern: RegExp }> = [
    { step: "lint", pattern: /\b(lint|eslint|biome\s+check)\b/ },
    { step: "test", pattern: /\b(test|vitest|jest)\b/ },
    { step: "typecheck", pattern: /\b(typecheck|type-check|tsc\s+--no-?emit)\b/ },
    { step: "build", pattern: /\bbuild\b/ },
    { step: "audit", pattern: /\baudit\b/ },
    { step: "prettier", pattern: /\bprettier\b/ },
    { step: "format", pattern: /\bformat\b/ },
  ];
  try {
    const files = readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    for (const file of files) {
      const content = readFileSync(join(workflowDir, file), 'utf-8').toLowerCase();
      for (const { step, pattern } of keywordPatterns) {
        if (pattern.test(content)) steps.add(step);
      }
    }
  } catch { /* no workflows */ }
  return [...steps];
}

function detectMonorepoWorkspaces(pkgJsonPath: string): string[] {
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const workspaces = pkg.workspaces?.packages || pkg.workspaces;
    if (Array.isArray(workspaces)) return workspaces;
  } catch {}
  return [];
}

function isCliPackage(pkg: Record<string, unknown>): boolean {
  const hasBin =
    typeof pkg.bin === "string" ||
    (typeof pkg.bin === "object" && pkg.bin !== null && Object.keys(pkg.bin as Record<string, unknown>).length > 0);
  const hasCliName = typeof pkg.name === "string" && /(^|[-_])cli($|[-_])/.test(pkg.name);
  const hasCliKeywords =
    Array.isArray(pkg.keywords) &&
    pkg.keywords.some((k) => typeof k === "string" && /(cli|command-?line|terminal)/i.test(k));
  return hasBin || hasCliName || hasCliKeywords;
}

function detectCliProject(targetDir: string, rootPkgJsonPath: string): boolean {
  if (existsSync(rootPkgJsonPath)) {
    try {
      const rootPkg = JSON.parse(readFileSync(rootPkgJsonPath, "utf-8"));
      if (isCliPackage(rootPkg)) return true;
    } catch {
      // ignore parse errors
    }
  }

  const pkgJsonFiles = findFiles(targetDir, /^package\.json$/, 4).filter(
    (f) => f !== rootPkgJsonPath && !f.includes("node_modules")
  );
  for (const pkgPath of pkgJsonFiles) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (isCliPackage(pkg)) return true;
    } catch {
      // ignore parse errors
    }
  }
  return false;
}

function detectCliDiagnosabilitySignals(targetDir: string): string[] {
  const signals: Set<string> = new Set();

  const readmePath = join(targetDir, "README.md");
  if (existsSync(readmePath)) {
    try {
      const readmeContent = readFileSync(readmePath, "utf-8");
      if (/\bdoctor\b|\bhealth check\b/i.test(readmeContent)) signals.add("doctor docs");
    } catch {
      // ignore read errors
    }
  }

  const workflowDir = join(targetDir, ".github", "workflows");
  if (existsSync(workflowDir)) {
    try {
      const files = readdirSync(workflowDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
      for (const file of files) {
        const workflowContent = readFileSync(join(workflowDir, file), "utf-8");
        if (/\baudit\b|\bdoctor\b/i.test(workflowContent)) {
          signals.add("ci diagnostic checks");
          break;
        }
      }
    } catch {
      // ignore read errors
    }
  }

  const sourceFiles = findFiles(targetDir, /^index\.(ts|js|mjs|cjs)$/, 5).filter((f) => !f.includes("node_modules"));
  for (const file of sourceFiles) {
    try {
      const sourceContent = readFileSync(file, "utf-8");
      if (/function\s+doctor\s*\(|--help|Unknown command|printHelp/i.test(sourceContent)) {
        signals.add("cli diagnostic command surface");
        break;
      }
    } catch {
      // ignore read errors
    }
  }

  const testFiles = findFiles(targetDir, /\.(test|spec)\.(ts|js|mjs|cjs)$/, 5).filter((f) => !f.includes("node_modules"));
  for (const file of testFiles) {
    try {
      const testContent = readFileSync(file, "utf-8");
      if (/--help|Unknown command|doctor/i.test(testContent)) {
        signals.add("cli diagnostic tests");
        break;
      }
    } catch {
      // ignore read errors
    }
  }

  return [...signals];
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
    { path: "risk-policy.json", content: riskPolicyTemplate() },
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
          "Review risk-policy.json — set tiers and docs drift rules for your repo",
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

  // Bonus: Per-package AGENTS.md detection
  const allAgentsMd = findFiles(targetDir, /^AGENTS\.md$/);
  if (allAgentsMd.length >= 2) {
    result.scores.repository_knowledge.findings.push(
      `Hierarchical AGENTS.md detected (${allAgentsMd.length} files)`
    );
  }

  // Bonus: Verification headers detection
  const allDocFiles = findFiles(targetDir, /\.(md|markdown)$/);
  const verifiedDocs = allDocFiles.filter(f => {
    try { return readFileSync(f, 'utf-8').includes('<!-- Verified:'); } catch { return false; }
  });
  if (verifiedDocs.length > 0) {
    result.scores.repository_knowledge.findings.push(
      `Verification headers found in ${verifiedDocs.length} doc(s)`
    );
  }

  const docsDir = join(targetDir, "docs");
  if (existsSync(docsDir)) {
    const hasDesignDocs = existsSync(join(docsDir, "design-docs"));
    const hasIndex = existsSync(join(docsDir, "design-docs", "index.md"));
    if (hasDesignDocs && hasIndex) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push("docs/design-docs/ with index exists");

      // Design decision count
      const indexContent = readFileSync(join(docsDir, "design-docs", "index.md"), "utf-8");
      const tableRows = indexContent.split("\n").filter(l => l.includes("|")).length;
      // Subtract header rows (header + separator = 2)
      const dataRows = Math.max(0, tableRows - 2);
      if (dataRows >= 3) {
        result.scores.repository_knowledge.findings.push(
          `${dataRows} design decisions documented`
        );
      }
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
  // Combined check: ARCHITECTURE.md exists AND has dependency direction content
  if (existsSync(archMd)) {
    const archContent = readFileSync(archMd, "utf-8");
    if (/dependenc|layer|forward only|import/i.test(archContent)) {
      result.scores.architecture_enforcement.score++;
      result.scores.architecture_enforcement.findings.push(
        "ARCHITECTURE.md with dependency direction rules"
      );
    } else {
      result.scores.architecture_enforcement.findings.push(
        "ARCHITECTURE.md exists but lacks dependency direction rules"
      );
      result.recommendations.push("Document dependency direction rules in ARCHITECTURE.md");
    }
  } else {
    result.scores.architecture_enforcement.findings.push("ARCHITECTURE.md missing");
    result.recommendations.push("Create ARCHITECTURE.md with domain map and layer rules");
  }

  // Linter enforcement depth
  const hasEslint =
    existsSync(join(targetDir, ".eslintrc.json")) ||
    existsSync(join(targetDir, ".eslintrc.js")) ||
    existsSync(join(targetDir, "eslint.config.js")) ||
    existsSync(join(targetDir, "eslint.config.mjs"));
  const hasBiome = existsSync(join(targetDir, "biome.json"));
  const structuralLintScripts = findFiles(join(targetDir, "scripts"), /lint|structure/i, 1);
  const hasStructuralLintScript = existsSync(join(targetDir, "scripts")) && structuralLintScripts.length > 0;

  if (hasEslint || hasBiome) {
    let linterDeep = false;
    // Check for architectural keywords in linter config
    const linterConfigs = [".eslintrc.json", ".eslintrc.js", "eslint.config.js", "eslint.config.mjs", "biome.json"];
    for (const cfg of linterConfigs) {
      const cfgPath = join(targetDir, cfg);
      if (existsSync(cfgPath)) {
        try {
          const cfgContent = readFileSync(cfgPath, "utf-8");
          if (/no-restricted-imports|import\/no-default-export|boundaries|dependency/i.test(cfgContent)) {
            linterDeep = true;
          }
          // biome.json with 5+ rules
          if (cfg === "biome.json") {
            const rulesMatch = cfgContent.match(/"(recommended|all|suspicious|correctness|style|complexity|nursery|performance|security|a11y)"/g);
            if (rulesMatch && rulesMatch.length >= 5) linterDeep = true;
          }
        } catch { /* skip */ }
      }
    }
    if (hasStructuralLintScript) linterDeep = true;

    if (linterDeep) {
      result.scores.architecture_enforcement.score++;
      result.scores.architecture_enforcement.findings.push("Linter configuration found with architectural enforcement");
    } else {
      result.scores.architecture_enforcement.score++;
      result.scores.architecture_enforcement.findings.push("Linter configuration found");
    }
  } else {
    result.scores.architecture_enforcement.findings.push("No linter configuration found");
    result.recommendations.push("Add linter configuration to enforce architectural constraints");
  }

  // Enforcement evidence: +1 if any 2 of these are true
  const hasRiskPolicy = existsSync(join(targetDir, "risk-policy.json"));
  const workflowDir = join(targetDir, ".github", "workflows");
  const ciEnforcementSteps = existsSync(workflowDir) ? scanWorkflowsForEnforcement(workflowDir) : [];
  const ciRefsEnforcement = ciEnforcementSteps.some(s => ['lint', 'test', 'typecheck', 'type-check'].includes(s));
  const goldenPath = join(targetDir, "docs", "golden-principles.md");
  let goldenEnforcementRatio = false;
  if (existsSync(goldenPath)) {
    const gpContent = readFileSync(goldenPath, "utf-8");
    // Check if at least 1 principle has a linter reference
    if (/lint|eslint|biome|enforced/i.test(gpContent) && (hasEslint || hasBiome)) {
      goldenEnforcementRatio = true;
    }
  }

  const enforcementSignals = [hasRiskPolicy, ciRefsEnforcement, hasStructuralLintScript, goldenEnforcementRatio].filter(Boolean).length;
  if (enforcementSignals >= 2) {
    result.scores.architecture_enforcement.score++;
    result.scores.architecture_enforcement.findings.push(
      `Enforcement evidence detected (${enforcementSignals} signals)`
    );
  } else if (enforcementSignals === 1) {
    result.scores.architecture_enforcement.findings.push(
      "Partial enforcement evidence (need 2+ signals)"
    );
  }

  // ── Agent Legibility ──────────────────────────────────────────────────

  // Check if app is bootable (look for dev scripts) — monorepo-aware
  const pkgJson = join(targetDir, "package.json");
  const monorepoWorkspaces = existsSync(pkgJson) ? detectMonorepoWorkspaces(pkgJson) : [];
  const isMonorepo = monorepoWorkspaces.length > 0;
  const isCliRepo = detectCliProject(targetDir, pkgJson);

  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
      if (pkg.scripts?.dev || pkg.scripts?.start) {
        result.scores.agent_legibility.score++;
        result.scores.agent_legibility.findings.push("App has dev/start script (bootable)");
      } else if (isMonorepo) {
        // Check if any workspace has dev/start script
        let workspaceBootable = false;
        for (const ws of monorepoWorkspaces) {
          const wsPattern = ws.replace(/\*/g, '');
          const wsDir = join(targetDir, wsPattern);
          if (existsSync(wsDir)) {
            try {
              const entries = readdirSync(wsDir);
              for (const entry of entries) {
                const wsPkg = join(wsDir, entry, "package.json");
                if (existsSync(wsPkg)) {
                  const wsPkgData = JSON.parse(readFileSync(wsPkg, "utf-8"));
                  if (wsPkgData.scripts?.dev || wsPkgData.scripts?.start) {
                    workspaceBootable = true;
                    break;
                  }
                }
              }
            } catch { /* skip */ }
          }
          if (workspaceBootable) break;
        }
        if (workspaceBootable) {
          result.scores.agent_legibility.score++;
          result.scores.agent_legibility.findings.push(
            `Monorepo detected with ${monorepoWorkspaces.length} workspace(s), bootable workspace found`
          );
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Check for observability config — expanded
  const obsFiles = ["docker-compose.yml", "docker-compose.yaml", "grafana", "prometheus.yml"];
  const hasTraditionalObs = obsFiles.some(
    (f) => existsSync(join(targetDir, f)) || existsSync(join(targetDir, "infra", f))
  );
  // Modern observability signals
  const sentryFiles = findFiles(targetDir, /^sentry\.(client|server)\.config\./i, 1);
  const hasVercelJson = existsSync(join(targetDir, "vercel.json"));
  const hasNetlifyToml = existsSync(join(targetDir, "netlify.toml"));
  let hasSentryDep = false;
  let hasDatadogDep = false;
  if (existsSync(pkgJson)) {
    try {
      const pkgContent = readFileSync(pkgJson, "utf-8");
      hasSentryDep = pkgContent.includes("@sentry/");
      hasDatadogDep = pkgContent.includes("datadog-ci");
    } catch { /* ignore */ }
  }
  const hasSentryEnv = findFiles(targetDir, /^\.env\.sentry/i, 1).length > 0;
  const hasModernObs = sentryFiles.length > 0 || hasVercelJson || hasNetlifyToml || hasSentryDep || hasDatadogDep || hasSentryEnv;

  if (hasTraditionalObs || hasModernObs) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push("Observability configuration found");
  } else if (isCliRepo) {
    const cliDiagSignals = detectCliDiagnosabilitySignals(targetDir);
    if (cliDiagSignals.length >= 2) {
      result.scores.agent_legibility.score++;
      result.scores.agent_legibility.findings.push(
        `CLI diagnosability signals found (${cliDiagSignals.join(", ")})`
      );
    } else {
      result.scores.agent_legibility.findings.push("No observability or CLI diagnosability signals detected");
    }
  } else {
    result.scores.agent_legibility.findings.push("No observability stack detected");
  }

  // Dependency count — monorepo-aware
  if (existsSync(pkgJson)) {
    try {
      if (isMonorepo) {
        // Average workspace dependency counts
        const wsPkgFiles = findFiles(targetDir, /^package\.json$/, 3).filter(
          f => f !== pkgJson && !f.includes('node_modules')
        );
        if (wsPkgFiles.length > 0) {
          let totalDeps = 0;
          let counted = 0;
          for (const wsPkg of wsPkgFiles) {
            try {
              const wsPkgData = JSON.parse(readFileSync(wsPkg, "utf-8"));
              totalDeps += Object.keys(wsPkgData.dependencies || {}).length;
              counted++;
            } catch { /* skip */ }
          }
          const avgDeps = counted > 0 ? Math.round(totalDeps / counted) : 0;
          if (avgDeps < 30) {
            result.scores.agent_legibility.score++;
            result.scores.agent_legibility.findings.push(
              `Lean workspace dependencies (avg ${avgDeps} across ${counted} packages)`
            );
          } else {
            result.scores.agent_legibility.findings.push(
              `Heavy workspace dependencies (avg ${avgDeps} across ${counted} packages) — consider trimming`
            );
          }
        }
      } else {
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
      }
    } catch {
      // ignore
    }
  }

  // ── Golden Principles ─────────────────────────────────────────────────

  if (existsSync(goldenPath)) {
    result.scores.golden_principles.score++;
    const gpContent = readFileSync(goldenPath, "utf-8");
    const principleCount = countGoldenPrinciples(gpContent);
    if (principleCount >= 5) {
      result.scores.golden_principles.findings.push(
        `Golden principles documented (${principleCount} principles)`
      );
    } else {
      result.scores.golden_principles.findings.push(
        `Golden principles documented — only ${principleCount} principles, consider adding more`
      );
    }
    // Anti-patterns detection
    if (/anti-pattern|don['']t|never|avoid/i.test(gpContent)) {
      result.scores.golden_principles.findings.push("Anti-patterns documented");
    }
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

    // CI enforcement quality enrichment
    if (existsSync(workflowDir)) {
      const enfSteps = scanWorkflowsForEnforcement(workflowDir);
      if (enfSteps.length >= 3) {
        result.scores.golden_principles.findings.push(
          `CI enforces ${enfSteps.length} quality gates (${enfSteps.join(", ")})`
        );
      }
    }
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

  // Check for CLAUDE.md or similar agent config (also detect conductor.json)
  const agentConfigs = ["CLAUDE.md", ".claude", "CODEX.md", ".cursor", "conductor.json"];
  const hasAgentConfig = agentConfigs.some((f) => existsSync(join(targetDir, f)));
  if (hasAgentConfig) {
    result.scores.agent_workflow.score++;
    result.scores.agent_workflow.findings.push("Agent configuration found");
  } else {
    result.scores.agent_workflow.findings.push("No agent configuration (CLAUDE.md, .cursor, conductor.json, etc.)");
  }

  // Broader workflow check: PR template OR risk-policy OR issue templates OR conductor.json
  const hasPRTemplate =
    existsSync(join(targetDir, ".github", "pull_request_template.md")) ||
    existsSync(join(targetDir, ".github", "PULL_REQUEST_TEMPLATE.md"));
  const hasIssueTemplates = existsSync(join(targetDir, ".github", "ISSUE_TEMPLATE"));
  const hasConductor = existsSync(join(targetDir, "conductor.json"));

  if (hasPRTemplate || hasRiskPolicy || hasIssueTemplates || hasConductor) {
    result.scores.agent_workflow.score++;
    const signals: string[] = [];
    if (hasPRTemplate) signals.push("PR template");
    if (hasRiskPolicy) signals.push("risk-policy.json");
    if (hasIssueTemplates) signals.push("issue templates");
    if (hasConductor) signals.push("conductor.json");
    result.scores.agent_workflow.findings.push(`Workflow governance found (${signals.join(", ")})`);
  }

  // CI quality check: workflows directory with 2+ enforcement steps
  if (existsSync(workflowDir)) {
    const wfEnfSteps = ciEnforcementSteps.filter(s =>
      ['lint', 'test', 'build', 'typecheck', 'type-check'].includes(s)
    );
    if (wfEnfSteps.length >= 2) {
      result.scores.agent_workflow.score++;
      result.scores.agent_workflow.findings.push(
        `CI workflows with enforcement (${wfEnfSteps.join(", ")})`
      );
    } else {
      result.scores.agent_workflow.findings.push(
        "CI workflows exist but lack sufficient enforcement steps (need 2+)"
      );
    }
  }

  // ── Garbage Collection ────────────────────────────────────────────────

  if (hasCleanupDocs) {
    result.scores.garbage_collection.score++;
    result.scores.garbage_collection.findings.push("Tech debt tracked in-repo");
  } else {
    result.scores.garbage_collection.findings.push("No tech debt tracking");
  }

  // Active doc-gardening: design-docs index with verification, OR doc-gardener script, OR 3+ verified docs
  const hasDocGardening = existsSync(join(targetDir, "docs", "design-docs", "index.md"));
  let docGardeningFound = false;
  if (hasDocGardening) {
    const dgContent = readFileSync(join(targetDir, "docs", "design-docs", "index.md"), "utf-8");
    if (/verif|status|last.*check/i.test(dgContent)) {
      docGardeningFound = true;
    }
  }
  // Doc-gardener scripts
  const docGardenerScripts = existsSync(join(targetDir, "scripts"))
    ? findFiles(join(targetDir, "scripts"), /doc-gardener|freshness/i, 1)
    : [];
  if (docGardenerScripts.length > 0) docGardeningFound = true;
  // Verification headers in 3+ docs
  if (verifiedDocs.length >= 3) docGardeningFound = true;

  if (docGardeningFound) {
    result.scores.garbage_collection.score++;
    result.scores.garbage_collection.findings.push("Active doc-gardening detected");
  }

  // Quality grades OR drift enforcement
  let qualityGradesFound = false;
  if (existsSync(archMd)) {
    const archContentGC = readFileSync(archMd, "utf-8");
    if (/quality.*grade|grade/i.test(archContentGC)) {
      qualityGradesFound = true;
    }
  }
  // risk-policy.json with drift rules
  let driftEnforcement = false;
  if (hasRiskPolicy) {
    try {
      const rpContent = readFileSync(join(targetDir, "risk-policy.json"), "utf-8");
      if (/docsDriftRules|watchPaths/i.test(rpContent)) {
        driftEnforcement = true;
      }
    } catch { /* skip */ }
  }
  // Docs-drift enforcement script
  const docsDriftScripts = existsSync(join(targetDir, "scripts"))
    ? findFiles(join(targetDir, "scripts"), /drift|docs-drift/i, 1)
    : [];
  if (docsDriftScripts.length > 0) driftEnforcement = true;

  if (qualityGradesFound || driftEnforcement) {
    result.scores.garbage_collection.score++;
    if (qualityGradesFound) {
      result.scores.garbage_collection.findings.push("Quality grades tracked in architecture");
    }
    if (driftEnforcement) {
      result.scores.garbage_collection.findings.push("Drift enforcement detected");
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
  const doctorCiPaths = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile"];
  if (doctorCiPaths.some((p) => existsSync(join(targetDir, p)))) {
    checks.push({ check: "CI pipeline exists", status: "pass", fix: "" });

    // CI enforcement quality
    const doctorWorkflowDir = join(targetDir, ".github", "workflows");
    if (existsSync(doctorWorkflowDir)) {
      const enfSteps = scanWorkflowsForEnforcement(doctorWorkflowDir);
      if (enfSteps.length >= 2) {
        checks.push({ check: `CI enforces ${enfSteps.length} quality gates`, status: "pass", fix: "" });
      } else {
        checks.push({
          check: "CI lacks enforcement steps",
          status: "warn",
          fix: "Add lint, test, and typecheck steps to CI workflows",
        });
      }
    }
  } else {
    checks.push({
      check: "No CI pipeline",
      status: "warn",
      fix: "Add CI pipeline to enforce golden principles mechanically",
    });
  }

  // risk-policy.json
  if (existsSync(join(targetDir, "risk-policy.json"))) {
    checks.push({ check: "risk-policy.json exists", status: "pass", fix: "" });
  } else {
    checks.push({
      check: "No risk-policy.json",
      status: "warn",
      fix: "Create risk-policy.json with risk tiers and docs-drift rules",
    });
  }

  // Verification headers in docs
  const doctorDocFiles = findFiles(targetDir, /\.(md|markdown)$/, 3);
  const doctorVerifiedDocs = doctorDocFiles.filter(f => {
    try { return readFileSync(f, 'utf-8').includes('<!-- Verified:'); } catch { return false; }
  });
  if (doctorVerifiedDocs.length > 0) {
    checks.push({ check: `Verification headers in ${doctorVerifiedDocs.length} doc(s)`, status: "pass", fix: "" });
  } else {
    checks.push({
      check: "No verification headers in docs",
      status: "warn",
      fix: "Add <!-- Verified: YYYY-MM-DD --> headers to key docs for freshness tracking",
    });
  }

  // Per-package AGENTS.md
  const doctorAgentsMdFiles = findFiles(targetDir, /^AGENTS\.md$/, 3);
  if (doctorAgentsMdFiles.length >= 2) {
    checks.push({ check: `Hierarchical AGENTS.md (${doctorAgentsMdFiles.length} files)`, status: "pass", fix: "" });
  }

  // Structural lint scripts
  if (existsSync(join(targetDir, "scripts"))) {
    const structScripts = findFiles(join(targetDir, "scripts"), /lint|structure/i, 1);
    if (structScripts.length > 0) {
      checks.push({ check: "Structural lint scripts found", status: "pass", fix: "" });
    } else {
      checks.push({
        check: "No structural lint scripts",
        status: "warn",
        fix: "Add scripts/structural-lint.ts to enforce layer and dependency rules",
      });
    }
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
      { step: 1, action: "Establish risk tiers and policy-as-code", description: "Create risk-policy.json defining risk tiers, docs-drift rules, and watch paths for enforcement.", automated: false },
      { step: 2, action: "Enforce golden principles mechanically", description: "Add structural lint scripts and CI gates that enforce golden principles — not just document them.", automated: false },
      { step: 3, action: "Enable self-validation", description: "Agent drives the app, takes screenshots, checks behavior against expectations.", automated: false },
      { step: 4, action: "Add doc-gardening automation", description: "Add verification headers (<!-- Verified: -->), freshness scripts, and recurring doc review.", automated: false },
      { step: 5, action: "Build escalation paths", description: "Clear criteria for when to involve humans vs. when agents can proceed autonomously.", automated: false },
    ],
    success_criteria: "Agent can end-to-end ship a feature from prompt to merge.",
  },
  "L3": {
    from: "L3: Autonomous",
    to: "L4: Self-Correcting",
    goal: "System maintains and improves itself without human intervention",
    steps: [
      { step: 1, action: "Implement active doc-gardening with drift detection", description: "Automated drift detection between docs and code, with auto-repair capabilities.", automated: false },
      { step: 2, action: "Add quality grades", description: "Per-domain, per-layer scoring tracked in ARCHITECTURE.md.", automated: false },
      { step: 3, action: "Automate enforcement ratio tracking", description: "Track >80% of golden principles enforced in CI — measure and improve coverage.", automated: false },
      { step: 4, action: "Track tech debt continuously", description: "In-repo tracker with recurring review — debt paid down in small increments.", automated: true },
      { step: 5, action: "Establish docs-drift rules", description: "Link code changes to required doc updates via risk-policy.json watchPaths and docsDriftRules.", automated: false },
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
