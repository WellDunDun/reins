# Harness Engineering Methodology Reference

> Source: OpenAI's "Harness Engineering" (Feb 2026, Ryan Lopopolo)

## Philosophy

Build and ship software with **zero manually-written code**. Humans design environments, specify intent, and build feedback loops. Agents write all code, tests, CI, docs, and tooling.

## The Five Pillars

### 1. Repository as System of Record

All knowledge must be versioned, in-repo, and agent-discoverable:

```
AGENTS.md              # ~100 lines, map to deeper docs
ARCHITECTURE.md        # Domain map, package layering, dependency rules
docs/
  design-docs/         # Indexed design decisions with verification status
    index.md
    core-beliefs.md
  exec-plans/          # First-class execution plans
    active/
    completed/
    tech-debt-tracker.md
  generated/           # Auto-generated docs (DB schema, API specs)
  product-specs/       # Product requirements and specs
    index.md
  references/          # External reference docs (LLM-friendly)
```

**Rules:**
- AGENTS.md is a map, not a manual (~100 lines)
- No knowledge lives in Slack, Google Docs, or human heads
- A "doc-gardening" agent scans for stale docs on a cadence
- A verification agent checks freshness and cross-links

### 2. Layered Domain Architecture

Each business domain follows a strict layer ordering:

```
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
```

**Rules:**
- Dependencies only flow "forward" (left to right)
- Cross-cutting concerns enter ONLY through Providers
- Enforce mechanically with custom linters and structural tests
- Violations fail CI, not code review

### 3. Agent Legibility

Optimize everything for agent understanding:

- Boot the app per git worktree (one instance per change)
- Wire Chrome DevTools Protocol into agent runtime (DOM snapshots, screenshots, navigation)
- Expose logs/metrics/traces via local observability stack (LogQL, PromQL, TraceQL)
- Ephemeral observability per worktree, torn down after task completion
- Prefer "boring" technology — composable, stable APIs, well-represented in training data
- Reimplement simple utilities rather than pulling opaque dependencies

### 4. Golden Principles (Mechanical Taste)

Opinionated rules that encode human taste mechanically:

- Prefer shared utility packages over hand-rolled helpers
- Validate data at boundaries, never probe shapes YOLO-style
- Use typed SDKs wherever possible
- Formatting and structural rules enforced in CI
- Rules checked and enforced by agents themselves
- Capture review feedback as documentation or tooling updates

### 5. Garbage Collection (Continuous Cleanup)

- Background agents scan for deviations on a recurring cadence
- Quality grades track each domain and architectural layer
- Targeted refactoring PRs auto-generated and auto-merged
- Technical debt paid continuously in small increments
- Stale documentation detected and updated automatically

## Agent Autonomy Levels

### Level 1: Prompted Execution
Agent receives prompt, writes code, opens PR. Human reviews and merges.

### Level 2: Agent Review Loop
Agent writes code, runs self-review, requests agent reviews, iterates until satisfied. Human spot-checks.

### Level 3: Full Autonomy
Agent validates codebase, reproduces bug, implements fix, validates fix, opens PR, responds to feedback, remediates failures, merges. Escalates only when judgment needed.

## Merge Philosophy

- Minimal blocking merge gates
- Short-lived PRs
- Test flakes addressed with follow-up runs, not blocking
- Corrections are cheap; waiting is expensive

## Anti-Patterns

- One giant AGENTS.md (context starvation, instant rot)
- Knowledge in external tools (Slack, Google Docs, wikis)
- Human code fixes (removes incentive for self-correction)
- Manual code review as primary quality gate
- Opaque dependencies agents can't reason about
- Letting tech debt compound without garbage collection
