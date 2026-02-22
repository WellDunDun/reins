# Evolve Workflow

Upgrade an existing project to the next harness engineering maturity level.

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

**Goal:** Agent handles full PR lifecycle.

1. **Wire agent review** — agent-to-agent review loops
2. **Add observability** — logs/metrics/traces accessible to agents
3. **Enable self-validation** — agent drives app, takes screenshots, checks behavior
4. **Reduce merge gates** — minimize blocking requirements
5. **Build escalation paths** — clear criteria for when to involve humans

**Success criteria:** Agent can end-to-end ship a feature from prompt to merge.

### L3 → L4: Autonomous → Self-Correcting

**Goal:** System maintains and improves itself.

1. **Implement doc-gardening** — recurring agent scans for stale docs
2. **Add quality grades** — per-domain, per-layer scoring
3. **Automate refactoring** — background agents open cleanup PRs
4. **Track tech debt** — in-repo tracker with recurring review
5. **Enable continuous improvement** — human taste captured once, enforced continuously

**Success criteria:** Codebase improves in quality without human intervention.

## Steps

1. Run Audit workflow to get current scores
2. Identify current maturity level
3. Present the evolution path for current → next level
4. Execute each step in the path (using agents, not manual code)
5. Re-audit to verify level-up
6. Document what changed in exec-plans/completed/
