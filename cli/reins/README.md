# reins — Harness Engineering CLI

Scaffold, audit, and evolve projects using the [Harness Engineering](https://openai.com/index/harness-engineering/) methodology.

## Relationship to the Reins skill

- `reins-cli` is the execution engine (deterministic JSON commands).
- The Reins skill is the control plane that teaches coding agents when/how to call this CLI.
- Human operators steer intent; agents execute with Reins command outputs.

For end-user agent workflows, install the skill first:

```bash
npx skills add WellDunDun/reins
```

## What is Harness Engineering?

A development methodology where **humans steer and agents execute**. All code — application logic, tests, CI, docs, tooling — is written by AI agents. Humans design environments, specify intent, and build feedback loops.

## Install

```bash
# From npm
# "." means "current directory"
npx reins-cli@latest audit .

# Or clone and link
git clone https://github.com/WellDunDun/reins.git
cd reins/cli/reins
bun install
bun link
```

## Commands

Path reminder: `.` = current directory, `..` = parent directory.

### `reins init <path>`

Scaffold the full harness engineering structure in a directory:

```bash
reins init .
reins init ./my-project --name "My Project"
reins init . --force  # Overwrite existing files
reins init . --pack auto  # Adaptive pack selection from project signals
reins init . --pack agent-factory  # Optional advanced automation pack
```

Creates:
- `AGENTS.md` — Concise map (~100 lines) pointing to deeper docs
- `ARCHITECTURE.md` — Domain map with layered architecture rules
- `docs/golden-principles.md` — Mechanical taste rules
- `docs/design-docs/` — Indexed design documents with verification tracking
- `docs/design-docs/core-beliefs.md` — Agent-first operating principles
- `docs/product-specs/` — Product specification registry
- `docs/exec-plans/` — Active plans, completed plans, tech debt tracker
- `docs/references/` — External LLM-friendly reference docs
- `docs/generated/` — Auto-generated documentation

Pack modes:
- `--pack auto` selects a compatible pack when stack signals are clear, otherwise keeps base scaffold.
- `--pack agent-factory` explicitly scaffolds advanced automation:
- `scripts/lint-structure.mjs`, `scripts/doc-gardener.mjs`, `scripts/check-changed-doc-freshness.mjs`, `scripts/pr-review.mjs`
- `.github/workflows/risk-policy-gate.yml`, `.github/workflows/pr-review-bot.yml`, `.github/workflows/structural-lint.yml`

### `reins audit <path>`

Score a project against harness engineering principles (0-24):

```bash
reins audit .
```

Scores six dimensions (variable max per dimension, 24 total):
1. **Repository Knowledge** (0-4) — AGENTS.md, docs/, versioned plans
2. **Architecture Enforcement** (0-3) — ARCHITECTURE.md, dependency rules, linters
3. **Agent Legibility** (0-5) — Bootable app, observability, lean dependencies
4. **Golden Principles** (0-3) — Documented rules, CI enforcement, cleanup process
5. **Agent Workflow** (0-6) — Agent config, PR templates, merge gates, orchestration readiness
6. **Garbage Collection** (0-3) — Debt tracking, doc-gardening, quality grades

Returns a maturity level:
- **L0: Manual** (0-6) — Traditional engineering
- **L1: Inloop** (7-12) — Agents help, humans still code
- **L2: Guided Outloop** (13-18) — Humans steer, agents execute
- **L3: Full Outloop** (19-21) — Agents handle full lifecycle
- **L4: Zero Touch** (22-24) — System maintains itself

### `reins evolve <path>`

Show the evolution path from your current maturity level to the next:

```bash
reins evolve .
reins evolve . --apply   # Auto-run scaffolding steps
```

Runs an audit, identifies your current level, and returns a step-by-step roadmap to level up — including which steps are automatable and which require human decisions.

### `reins doctor <path>`

Check project health with prescriptive fixes:

```bash
reins doctor .
```

Returns pass/fail/warn for each check with specific fix instructions.

### `reins compare <path> <baseline.json>`

Compare the current audit score against a saved baseline:

```bash
reins audit . > baseline.json
# ... make changes ...
reins compare . baseline.json
```

Returns a dimension-by-dimension diff showing score deltas and maturity level changes, useful for tracking progress over time or validating that a set of changes improved readiness.

## Output

All commands output deterministic JSON, making them composable with other tools:

```bash
reins audit . | jq '.maturity_level'
reins doctor . | jq '.checks[] | select(.status == "fail")'
```

## Methodology

Based on OpenAI's internal experiment building a product with zero manually-written code:

1. **Repository is the system of record** — All knowledge versioned in-repo
2. **Progressive disclosure** — Short AGENTS.md as map, deep docs elsewhere
3. **Layered domain architecture** — Types > Config > Repo > Service > Runtime > UI
4. **Golden principles** — Mechanical taste enforced in CI
5. **Garbage collection** — Background agents clean drift continuously
6. **Corrections are cheap** — Minimal blocking merge gates

## Runtime

- **Runtime:** Bun or Node.js
- **Language:** TypeScript
- **Output:** JSON
