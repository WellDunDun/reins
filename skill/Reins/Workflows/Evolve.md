# Reins Evolve Workflow

Upgrade an existing project to the next harness engineering maturity level.

## Default Command

Run:
- Local source: `cd cli/reins && bun src/index.ts evolve <path>`
- Package mode: `npx reins-cli evolve <path>`

## Prerequisites

Run the Audit workflow first to determine current maturity level and gaps.

## Evolution Paths

### L0 → L1: Manual → Assisted

**Goal:** Get agents into the development loop.

1. **Create AGENTS.md** — concise map to repository knowledge
2. **Create docs/ structure** — design docs, product specs, references
3. **Document architecture** — ARCHITECTURE.md with domain map
4. **Set up agent-friendly CI** — fast feedback, clear error messages
5. **First agent PR** — have an agent open its first PR from a prompt

**Success criteria:** Agent can read AGENTS.md and open a useful PR.

### L1 → L2: Assisted → Steered

**Goal:** Shift from human-writes-code to human-steers-agent.

1. **Write golden principles** — mechanical taste rules enforced in CI
2. **Add structural linters** — dependency direction, layer violations
3. **Enable worktree isolation** — app bootable per branch/worktree
4. **Create exec-plan templates** — versioned plans in-repo
5. **Adopt prompt-first workflow** — describe tasks, don't write code

**Success criteria:** Most new code written by agents, not humans.

### L2 → L3: Steered → Autonomous

**Goal:** Agent handles full PR lifecycle with policy-driven guardrails.

1. **Establish risk tiers and policy-as-code** — create risk-policy.json defining risk levels, watch paths, and escalation rules
2. **Enforce golden principles mechanically** — structural lint scripts, CI gates that fail on violations
3. **Enable self-validation** — agent drives app, takes screenshots, checks behavior
4. **Add doc-gardening automation** — verification headers (`<!-- Verified: DATE -->`), freshness scripts in CI
5. **Build escalation paths** — clear criteria for when to involve humans

**Success criteria:** Agent can end-to-end ship a feature from prompt to merge.

### L3 → L4: Autonomous → Self-Correcting

**Goal:** System maintains and improves itself with active drift detection.

1. **Implement active doc-gardening** — drift detection and auto-repair via doc-gardener scripts, verification header enforcement
2. **Add quality grades per domain** — A/B/C/D scoring per domain and architectural layer
3. **Automate enforcement ratio tracking** — target >80% of golden principles enforced in CI, track coverage continuously
4. **Track tech debt continuously** — in-repo tracker with recurring agent-driven review and cleanup PRs
5. **Establish docs-drift rules** — risk-policy.json watchPaths linking code changes to required doc updates

**Success criteria:** Codebase improves in quality without human intervention.

## Steps

1. Run Audit workflow to get current scores
2. Identify current maturity level
3. Present the evolution path for current → next level
4. Execute each step in the path (using agents, not manual code)
5. Re-audit to verify level-up
6. Document what changed in exec-plans/completed/
