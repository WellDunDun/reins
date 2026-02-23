export type AutomationPack = "none" | "auto" | "agent-factory";

export interface AgentFactoryPackFile {
  path: string;
  content: string;
}

export function agentsMdTemplate(projectName: string): string {
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

export function architectureMdTemplate(projectName: string): string {
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

export function goldenPrinciplesTemplate(): string {
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

export function coreBeliefsTemplate(): string {
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

export function techDebtTrackerTemplate(): string {
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

export function riskPolicyTemplate(pack: AutomationPack = "none"): string {
  if (pack === "agent-factory") {
    return `{
  "version": 1,
  "description": "Agent-factory policy template for high-autonomy repositories. High-risk changes require human review and stronger CI gates.",
  "tiers": ["low", "medium", "high"],
  "riskTierRules": {
    "high": [
      "src/security/",
      "src/auth/",
      ".github/workflows/",
      "risk-policy.json",
      "AGENTS.md",
      "ARCHITECTURE.md"
    ],
    "low": ["**"]
  },
  "mergePolicy": {
    "high": {
      "requiredChecks": ["ci", "structural-lint", "risk-policy-gate"],
      "requiresHumanReview": true,
      "minApprovals": 1
    },
    "low": {
      "requiredChecks": ["ci"],
      "requiresHumanReview": false
    }
  },
  "docsDriftRules": {
    "watchPaths": ["src/", "scripts/", ".github/workflows/"],
    "mustUpdate": ["AGENTS.md", "ARCHITECTURE.md", "docs/golden-principles.md"]
  }
}
`;
  }

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

function agentFactoryLintStructureScriptTemplate(): string {
  return `#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "apps", "packages"];
const CODE_FILE_PATTERN = /\\.(ts|tsx|js|jsx|mjs|cjs)$/;

const checks = [
  {
    id: "no-window-confirm",
    pattern: /window\\\\.confirm\\\\(/,
    message: "Use a controlled confirmation flow instead of window.confirm().",
  },
  {
    id: "no-raw-img",
    pattern: /<img[\\\\s>\\\\/]/,
    message: "Use framework image components instead of raw <img> where possible.",
  },
  {
    id: "no-nested-ternary",
    pattern: /\\\\?.*:\\\\s*.*\\\\?.*:/,
    message: "Avoid nested ternaries. Prefer explicit control flow.",
  },
];

function collectFiles(dir) {
  const files = [];
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat = null;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (!stat) continue;

    if (stat.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", ".next"].includes(entry)) continue;
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (CODE_FILE_PATTERN.test(entry)) files.push(fullPath);
  }

  return files;
}

const files = [];
for (const dir of TARGET_DIRS) {
  files.push(...collectFiles(join(ROOT, dir)));
}

const violations = [];
for (const file of files) {
  let content = "";
  try {
    content = readFileSync(file, "utf-8");
  } catch {
    continue;
  }

  const lines = content.split("\\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const check of checks) {
      if (!check.pattern.test(line)) continue;
      violations.push({
        file: relative(ROOT, file),
        line: i + 1,
        rule: check.id,
        message: check.message,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Structural lint violations found:");
  for (const violation of violations) {
    console.error(
      "- " +
        violation.file +
        ":" +
        violation.line +
        " [" +
        violation.rule +
        "] " +
        violation.message,
    );
  }
  process.exit(1);
}

console.log("Structural lint passed.");
`;
}

function agentFactoryDocGardenerScriptTemplate(): string {
  return `#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, "docs");
const STALE_DAYS = 90;
const VERIFIED_PATTERN = /<!--\\\\s*Verified:\\\\s*(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s*(?:\\\\|[^>]*)?-->/;

function collectMarkdown(dir) {
  const files = [];
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat = null;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (!stat) continue;

    if (stat.isDirectory()) {
      files.push(...collectMarkdown(fullPath));
      continue;
    }

    if (entry.endsWith(".md")) files.push(fullPath);
  }
  return files;
}

function ageInDays(dateStr) {
  const now = new Date();
  const verified = new Date(dateStr + "T00:00:00Z");
  const diffMs = now.getTime() - verified.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const files = collectMarkdown(DOCS_DIR);
const stale = [];
const unverified = [];

for (const file of files) {
  let content = "";
  try {
    content = readFileSync(file, "utf-8");
  } catch {
    continue;
  }
  const head = content.split("\\n").slice(0, 8).join("\\n");
  const match = VERIFIED_PATTERN.exec(head);
  if (!match) {
    unverified.push(relative(ROOT, file));
    continue;
  }

  const days = ageInDays(match[1]);
  if (days > STALE_DAYS) {
    stale.push(relative(ROOT, file) + " (" + days + " days)");
  }
}

if (stale.length > 0) {
  console.error("Stale docs detected:");
  for (const entry of stale) console.error("- " + entry);
  process.exit(1);
}

console.log("Doc-gardener passed. Unverified docs: " + unverified.length);
`;
}

function agentFactoryChangedDocFreshnessScriptTemplate(): string {
  return `#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const VERIFIED_PATTERN = /<!--\\\\s*Verified:\\\\s*(\\\\d{4}-\\\\d{2}-\\\\d{2})\\\\s*(?:\\\\|[^>]*)?-->/;

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

function isDocPath(filePath) {
  if (!filePath.endsWith(".md")) return false;
  return (
    filePath.startsWith("docs/") ||
    filePath === "AGENTS.md" ||
    filePath === "ARCHITECTURE.md" ||
    filePath === "docs/golden-principles.md"
  );
}

const changedPath = getArg("--changed-file-list");
if (!changedPath) {
  console.error("Missing required argument: --changed-file-list <path>");
  process.exit(2);
}

const changedFileList = existsSync(changedPath) ? changedPath : join(ROOT, changedPath);
if (!existsSync(changedFileList)) {
  console.error("Changed file list not found: " + changedFileList);
  process.exit(2);
}

const changedDocs = readFileSync(changedFileList, "utf-8")
  .split("\\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .filter(isDocPath);

if (changedDocs.length === 0) {
  console.log("No changed docs detected. Skipping changed-doc freshness gate.");
  process.exit(0);
}

const invalidDocs = [];
for (const relPath of changedDocs) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) continue;

  const content = readFileSync(fullPath, "utf-8");
  const head = content.split("\\n").slice(0, 8).join("\\n");
  if (!VERIFIED_PATTERN.test(head)) {
    invalidDocs.push(relPath + " (missing Verified header)");
  }
}

if (invalidDocs.length > 0) {
  console.error("Changed-doc freshness check failed:");
  for (const entry of invalidDocs) console.error("- " + entry);
  process.exit(1);
}

console.log("Changed-doc freshness check passed for " + changedDocs.length + " doc(s).");
`;
}

function agentFactoryPrReviewScriptTemplate(): string {
  return `#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

const changedPathArg = getArg("--changed-file-list");
if (!changedPathArg) {
  console.error("Missing required argument: --changed-file-list <path>");
  process.exit(2);
}

const changedPath = existsSync(changedPathArg) ? changedPathArg : join(ROOT, changedPathArg);
if (!existsSync(changedPath)) {
  console.error("Changed file list not found: " + changedPath);
  process.exit(2);
}

const checks = [
  {
    id: "no-window-confirm",
    pattern: /window\\\\.confirm\\\\(/,
    message: "Use a controlled confirmation flow instead of window.confirm().",
  },
  {
    id: "no-raw-img",
    pattern: /<img[\\\\s>\\\\/]/,
    message: "Prefer framework image components over raw <img>.",
  },
  {
    id: "no-nested-ternary",
    pattern: /\\\\?.*:\\\\s*.*\\\\?.*:/,
    message: "Avoid nested ternaries. Prefer explicit control flow.",
  },
];

const changedFiles = readFileSync(changedPath, "utf-8")
  .split("\\n")
  .map((line) => line.trim())
  .filter(Boolean);

const comments = [];

for (const relPath of changedFiles) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) continue;
  if (!/\\\\.(ts|tsx|js|jsx|mjs|cjs)$/.test(relPath)) continue;

  const content = readFileSync(fullPath, "utf-8");
  const lines = content.split("\\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const check of checks) {
      if (!check.pattern.test(line)) continue;
      comments.push({
        path: relPath,
        line: i + 1,
        body: "Golden principle (" + check.id + "): " + check.message,
      });
    }
  }
}

const output = { comments };
const json = JSON.stringify(output, null, 2);
console.log(json);
writeFileSync("/tmp/reins-review-comments.json", json, "utf-8");
process.exit(0);
`;
}

function agentFactoryRiskPolicyWorkflowTemplate(): string {
  return [
    "name: Risk Policy Gate",
    "",
    "on:",
    "  pull_request:",
    "    types: [opened, synchronize, reopened]",
    "",
    "permissions:",
    "  contents: read",
    "  pull-requests: write",
    "",
    "jobs:",
    "  risk-gate:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 8",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "",
    "      - name: Get changed files",
    "        run: |",
    "          git fetch --no-tags --depth=1 origin ${{ github.event.pull_request.base.sha }}",
    '          BASE_SHA="$(git rev-parse FETCH_HEAD)"',
    '          git diff --name-only "$BASE_SHA" HEAD > changed_files.txt',
    "          cat changed_files.txt",
    "",
    "      - name: Evaluate risk tier",
    "        id: evaluate",
    "        run: |",
    "          node - <<'NODE'",
    "          const fs = require('node:fs');",
    "          const policy = JSON.parse(fs.readFileSync('risk-policy.json', 'utf8'));",
    "          const changed = fs.readFileSync('changed_files.txt', 'utf8').split('\\n').map((x) => x.trim()).filter(Boolean);",
    "          const highPaths = (policy.riskTierRules && policy.riskTierRules.high) || [];",
    "          const highMatches = changed.filter((file) =>",
    "            highPaths.some((pattern) => file === pattern || file.startsWith(pattern + '/'))",
    "          );",
    "          const riskTier = highMatches.length > 0 ? 'HIGH' : 'LOW';",
    "          fs.appendFileSync(process.env.GITHUB_OUTPUT, `risk_tier=${riskTier}\\n`);",
    "          fs.writeFileSync('risk-summary.txt', highMatches.join('\\n'), 'utf8');",
    "          NODE",
    "",
    "      - name: Post risk summary comment",
    "        uses: actions/github-script@v7",
    "        with:",
    "          script: |",
    "            const marker = '<!-- reins-risk-policy-gate -->';",
    "            const riskTier = '${{ steps.evaluate.outputs.risk_tier }}';",
    "            const fs = require('node:fs');",
    "            const highMatches = fs.readFileSync('risk-summary.txt', 'utf8').split('\\n').map((x) => x.trim()).filter(Boolean);",
    "            let body = marker + '\\n## Risk Policy Gate\\n\\n';",
    "            body += '**Risk Tier:** ' + riskTier + '\\n';",
    "            if (highMatches.length > 0) {",
    "              body += '\\n### High-Risk Files Changed\\n';",
    "              for (const file of highMatches) body += '- `' + file + '`\\n';",
    "            }",
    "            const { data: comments } = await github.rest.issues.listComments({",
    "              owner: context.repo.owner,",
    "              repo: context.repo.repo,",
    "              issue_number: context.issue.number,",
    "            });",
    "            const existing = comments.find((c) => c.body && c.body.includes(marker));",
    "            if (existing) {",
    "              await github.rest.issues.updateComment({",
    "                owner: context.repo.owner,",
    "                repo: context.repo.repo,",
    "                comment_id: existing.id,",
    "                body,",
    "              });",
    "            } else {",
    "              await github.rest.issues.createComment({",
    "                owner: context.repo.owner,",
    "                repo: context.repo.repo,",
    "                issue_number: context.issue.number,",
    "                body,",
    "              });",
    "            }",
    "",
    "  docs-freshness:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 8",
    "    continue-on-error: true",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "      - name: Doc gardener",
    "        run: node scripts/doc-gardener.mjs",
    "",
    "  changed-doc-freshness:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 8",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "      - name: Get changed files",
    "        run: |",
    "          git fetch --no-tags --depth=1 origin ${{ github.event.pull_request.base.sha }}",
    '          BASE_SHA="$(git rev-parse FETCH_HEAD)"',
    '          git diff --name-only "$BASE_SHA" HEAD > changed_files.txt',
    "          cat changed_files.txt",
    "      - name: Check changed-doc freshness",
    "        run: node scripts/check-changed-doc-freshness.mjs --changed-file-list changed_files.txt",
    "",
  ].join("\\n");
}

function agentFactoryPrReviewWorkflowTemplate(): string {
  return [
    "name: PR Review Bot — Golden Principles",
    "",
    "on:",
    "  pull_request:",
    "    types: [opened, synchronize]",
    "",
    "permissions:",
    "  contents: read",
    "  pull-requests: write",
    "",
    "concurrency:",
    "  group: pr-review-bot-${{ github.event.pull_request.number }}",
    "  cancel-in-progress: true",
    "",
    "jobs:",
    "  review-changed-files:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 10",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "        with:",
    "          fetch-depth: 0",
    "",
    "      - name: Get changed files",
    "        run: |",
    "          git fetch --no-tags --depth=1 origin ${{ github.event.pull_request.base.sha }}",
    '          BASE_SHA="$(git rev-parse FETCH_HEAD)"',
    '          git diff --name-only "$BASE_SHA" HEAD > changed_files.txt',
    "          cat changed_files.txt",
    "",
    "      - name: Run review script",
    "        run: node scripts/pr-review.mjs --changed-file-list changed_files.txt > /tmp/reins-review-output.json",
    "",
    "      - name: Post review summary comment",
    "        uses: actions/github-script@v7",
    "        with:",
    "          script: |",
    "            const marker = '<!-- reins-pr-review -->';",
    "            const fs = require('node:fs');",
    "            const report = JSON.parse(fs.readFileSync('/tmp/reins-review-output.json', 'utf8'));",
    "            const comments = report.comments || [];",
    "            let body = marker + '\\n## Reins Golden Principles Review\\n\\n';",
    "            if (comments.length === 0) {",
    "              body += 'No golden principle violations found in changed files.';",
    "            } else {",
    "              body += 'Found **' + comments.length + '** potential violations.\\n\\n';",
    "              for (const item of comments.slice(0, 20)) {",
    "                body += '- `' + item.path + ':' + item.line + '` ' + item.body + '\\n';",
    "              }",
    "              if (comments.length > 20) body += '\\n...and more. See workflow logs for full output.\\n';",
    "            }",
    "            const { data: commentsList } = await github.rest.issues.listComments({",
    "              owner: context.repo.owner,",
    "              repo: context.repo.repo,",
    "              issue_number: context.issue.number,",
    "            });",
    "            const existing = commentsList.find((c) => c.body && c.body.includes(marker));",
    "            if (existing) {",
    "              await github.rest.issues.updateComment({",
    "                owner: context.repo.owner,",
    "                repo: context.repo.repo,",
    "                comment_id: existing.id,",
    "                body,",
    "              });",
    "            } else {",
    "              await github.rest.issues.createComment({",
    "                owner: context.repo.owner,",
    "                repo: context.repo.repo,",
    "                issue_number: context.issue.number,",
    "                body,",
    "              });",
    "            }",
    "",
  ].join("\\n");
}

function agentFactoryStructuralLintWorkflowTemplate(): string {
  return [
    "name: Structural Lint",
    "",
    "on:",
    "  pull_request:",
    "    types: [opened, synchronize, reopened]",
    "",
    "jobs:",
    "  structural-lint:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 8",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "      - name: Run structural lint",
    "        run: node scripts/lint-structure.mjs",
    "",
  ].join("\\n");
}

export function getAgentFactoryPackFiles(): AgentFactoryPackFile[] {
  return [
    { path: "scripts/lint-structure.mjs", content: agentFactoryLintStructureScriptTemplate() },
    { path: "scripts/doc-gardener.mjs", content: agentFactoryDocGardenerScriptTemplate() },
    { path: "scripts/check-changed-doc-freshness.mjs", content: agentFactoryChangedDocFreshnessScriptTemplate() },
    { path: "scripts/pr-review.mjs", content: agentFactoryPrReviewScriptTemplate() },
    { path: ".github/workflows/risk-policy-gate.yml", content: agentFactoryRiskPolicyWorkflowTemplate() },
    { path: ".github/workflows/pr-review-bot.yml", content: agentFactoryPrReviewWorkflowTemplate() },
    { path: ".github/workflows/structural-lint.yml", content: agentFactoryStructuralLintWorkflowTemplate() },
  ];
}

export function designDocsIndexTemplate(): string {
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

export function productSpecsIndexTemplate(): string {
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
