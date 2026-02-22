# reins — Harness Engineering CLI

Scaffold, audit, and evolve projects using the [Harness Engineering](https://openai.com/index/harness-engineering/) methodology.

## What is Harness Engineering?

A development methodology where **humans steer and agents execute**. All code — application logic, tests, CI, docs, tooling — is written by AI agents. Humans design environments, specify intent, and build feedback loops.

## Install

```bash
# From npm
npx reins-cli audit .

# Or clone and link
git clone https://github.com/WellDunDun/reins.git
cd reins/cli/reins
bun install
bun link
```

## Commands

### `reins init <path>`

Scaffold the full harness engineering structure in a directory:

```bash
reins init .
reins init ./my-project --name "My Project"
reins init . --force  # Overwrite existing files
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

### `reins audit <path>`

Score a project against harness engineering principles (0-18):

```bash
reins audit .
```

Scores six dimensions (0-3 each):
1. **Repository Knowledge** — AGENTS.md, docs/, versioned plans
2. **Architecture Enforcement** — ARCHITECTURE.md, dependency rules, linters
3. **Agent Legibility** — Bootable app, observability, lean dependencies
4. **Golden Principles** — Documented rules, CI enforcement, cleanup process
5. **Agent Workflow** — Agent config, PR templates, merge gates
6. **Garbage Collection** — Debt tracking, doc-gardening, quality grades

Returns a maturity level:
- **L0: Manual** (0-4) — Traditional engineering
- **L1: Assisted** (5-8) — Agents help, humans still code
- **L2: Steered** (9-13) — Humans steer, agents execute
- **L3: Autonomous** (14-16) — Agents handle full lifecycle
- **L4: Self-Correcting** (17-18) — System maintains itself

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
