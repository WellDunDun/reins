# Next Iteration: Stripe-Informed Audit Deepening

Created: 2026-03-05
Owner: Team
Status: Active
Source: Stripe Minions agentic engineering analysis (IndyDevDan extract-wisdom, 2026-03-05)

## Thesis

Stripe's Minions system validates Reins' core architecture — blueprints, conditional rules, tool registries, and agent sandboxes all map to existing Reins audit dimensions. The next iteration should **deepen existing dimensions** with richer sub-checks rather than adding new dimensions. This keeps the 6-dimension/0-18 JSON contract stable while dramatically increasing the signal quality of each score point.

## Strategic Approach

**Don't add dimensions. Raise the ceiling.**

Current scoring is largely file-existence checks (TD-002). Stripe's patterns reveal what *mature* versions of each dimension look like. The next iteration adds content-aware sub-checks that detect structural quality within existing artifacts, not just their presence.

**Key constraint preserved:** Zero dependencies, Bun-powered, file-detection only. All new sub-checks use `fs.readFileSync` + regex/string matching on config files already present in repos.

---

## P0 — Ship First (High impact, low risk)

### WS1: Agent Workflow Blueprints

**Dimension:** `agent_workflow` (currently max 3)

**What Stripe validates:** Blueprint engines interleave deterministic steps (lint, test, build) with agent reasoning. The presence of agent-specific workflow definitions — not just generic CI — is a maturity signal.

**New sub-checks:**

| Signal | Detection Pattern | Points To |
|--------|------------------|-----------|
| Agent command definitions | `.claude/commands/` dir exists with 1+ files | Agent has custom commands beyond defaults |
| Session orchestrator config | `.flow/`, `gsd/`, `conductor.json`, `.claude/settings.json` | Structured agent workflow beyond ad-hoc prompting |
| Agent-aware CI steps | CI YAML containing `claude`, `codex`, `cursor`, `agent`, `copilot` keywords | CI pipeline includes agent-specific steps |
| Interleaved workflow pattern | CI YAML with lint→test→agent or agent→lint→test ordering | Blueprint pattern: deterministic + agent interleaving |

**Scoring change:** Increase `agent_workflow.max` from 3 to 4. New sub-check contributes 1 additional point. Total max score becomes 19.

**Success criteria:** Repos with agent-specific workflow definitions (`.claude/commands/`, `.flow/`, etc.) score higher than repos with only generic CI.

### WS2: Conditional Context Engineering

**Dimension:** `repository_knowledge` (currently max 3)

**What Stripe validates:** Conditional rule files using glob patterns activate context per-directory. This is more sophisticated than a single AGENTS.md — it's hierarchical, conditional, and targeted.

**New sub-checks:**

| Signal | Detection Pattern | Points To |
|--------|------------------|-----------|
| Glob-based rule files | `.cursor/rules/*.mdc` with glob frontmatter; `.claude/rules/` or `.claude/settings.json` containing glob patterns | Conditional context engineering |
| Hierarchical agent context | 3+ `AGENTS.md` or `CLAUDE.md` files at different directory depths | Per-package agent context (not monolithic) |
| Context depth score | Count of distinct context files / total directories ratio | Density of agent-discoverable context |

**Scoring change:** Increase `repository_knowledge.max` from 3 to 4. New sub-check contributes 1 additional point. Total max score becomes 19 (or 20 with WS1).

**Success criteria:** Repos with hierarchical AGENTS.md and glob-based rule files score higher than repos with a single root AGENTS.md.

### WS3: Tool Registry Presence

**Dimension:** `agent_legibility` (currently max 3)

**What Stripe validates:** A tool shed / meta-tool helps agents discover 500 MCP tools. At smaller scale, the signal is simpler: does the repo declare available tools for agents?

**New sub-checks:**

| Signal | Detection Pattern | Points To |
|--------|------------------|-----------|
| MCP configuration | `.claude/mcp.json`, `.cursor/mcp.json`, `mcp.json` | Agent tooling declared and discoverable |
| Tool count depth | MCP config with 3+ tool entries | Meaningful tool ecosystem, not just a stub |
| Skills/extensions manifest | `skills.json`, `.claude/skills/`, `.cursor/extensions/` | Extended agent capabilities registered |

**Scoring change:** Increase `agent_legibility.max` from 3 to 4. New sub-check contributes 1 additional point.

**Success criteria:** Repos with MCP configs or skills manifests are recognized as more agent-legible.

---

## P1 — Ship Second (High impact, moderate effort)

### WS4: Maturity Model Language Update

**What Stripe validates:** The inloop (human prompting back-and-forth) vs outloop (fully autonomous agent) distinction maps cleanly to L2→L4 progression. Current maturity level descriptions are generic. Stripe's language is sharper.

**Changes:**

| Level | Current Description | Updated Description |
|-------|-------------------|-------------------|
| L0: Manual | (score ≤4) | No change — pre-agent baseline |
| L1: Assisted | (score ≤8) | **Inloop** — agents write code within human-driven sessions |
| L2: Steered | (score ≤13) | **Guided Outloop** — agents handle PR lifecycle, humans steer scope |
| L3: Autonomous | (score ≤16) | **Full Outloop** — agents operate from Slack/API triggers without human prompting |
| L4: Self-Correcting | (score >16) | **Zero Touch** — prompt to production, self-healing, system maintains itself |

**Implementation:** Update `resolveMaturityLevel()` return strings and evolve path descriptions. Non-breaking — the level names (L0-L4) stay the same, only the descriptive suffix changes.

**Success criteria:** `reins audit` output uses inloop/outloop language. `reins evolve` paths reference the progression clearly.

### WS5: ZTE Readiness Indicators

**Dimension:** Spread across existing dimensions as bonus findings (not scored points)

**What Stripe validates:** Zero Touch Engineering (prompt → production) is the north star. Even before achieving it, repos can show ZTE readiness signals.

**New findings (informational, not scored):**

| Signal | Detection Pattern | Finding Text |
|--------|------------------|-------------|
| Auto-merge config | CI YAML with `auto-merge`, `mergify`, `kodiak` keywords | "ZTE signal: auto-merge configuration detected" |
| Bot in CODEOWNERS | `CODEOWNERS` containing bot/agent usernames | "ZTE signal: agent listed as code owner" |
| Deploy-on-merge | CI YAML with deploy step triggered by merge to main | "ZTE signal: deploy-on-merge pattern detected" |
| Agent entry points | Slack/API/webhook triggers for agent workflows | "ZTE signal: non-human entry points for agent work" |

**These are findings, not score points.** They appear in audit output as forward-looking indicators. When enough accumulate, they naturally inform L4 scoring in a future iteration.

**Success criteria:** Repos with ZTE-adjacent patterns see them called out in audit findings.

### WS6: Evolve Path Enrichment

**Current state:** `reins evolve` paths have 5 steps per level. Stripe's patterns suggest more specific guidance.

**Changes:**
- L2→L3 path gains a step: "Add conditional context engineering (glob-based rule files, per-directory AGENTS.md)"
- L3→L4 path gains a step: "Declare agent tooling registry (MCP config, skills manifest)"
- L3→L4 path gains a step: "Implement non-human agent entry points (Slack, API, cron triggers)"

**Success criteria:** `reins evolve` output includes Stripe-validated guidance for conditional context and tool registries.

---

## P2 — Ship Third (Important, larger effort)

### WS7: Address Tech Debt TD-002 — Beyond File Existence

**Current state:** Audit heuristics are file-existence only. TD-002 is open.

**Stripe-informed approach:** Move scoring from "does file X exist?" to "does file X contain meaningful content?" This is what WS1-WS3 already do — they read file contents and check for structural patterns. Generalize this approach across all existing sub-checks:

| Current Check | Deepened Check |
|---------------|---------------|
| `AGENTS.md exists` | `AGENTS.md exists AND has section headers AND under 150 lines` (already done) |
| `ARCHITECTURE.md exists` | `ARCHITECTURE.md has dependency rules AND domain map table` |
| `Linter config exists` | `Linter config has architectural rules (not just formatting)` (partially done) |
| `CI pipeline exists` | `CI has 3+ enforcement steps AND runs on PRs` |
| `Golden principles exist` | `Golden principles has 5+ rules AND anti-patterns section` |

**This is an incremental deepening**, not a rewrite. Each existing `existsSync` check gains an optional content-quality bonus.

**Success criteria:** Audit scores differentiate between "has the file" and "file has meaningful content."

### WS8: Address Tech Debt TD-003 — Language Detection Broadening

**Current state:** Scoring is JS/TS-centric (package.json, eslint, biome). TD-003 is open.

**Stripe-informed insight:** Stripe uses Ruby (hundreds of millions of lines). The audit should detect repo language and adjust scoring signals accordingly.

**New language detection signals:**

| Language | Package File | Linter | CI Patterns |
|----------|-------------|--------|-------------|
| Python | `pyproject.toml`, `setup.py`, `requirements.txt` | `ruff.toml`, `.flake8`, `mypy.ini` | `pytest`, `mypy`, `ruff` |
| Ruby | `Gemfile` | `.rubocop.yml` | `rubocop`, `rspec`, `minitest` |
| Go | `go.mod` | `golangci.yml` | `golangci-lint`, `go test` |
| Rust | `Cargo.toml` | `clippy.toml` | `cargo clippy`, `cargo test` |
| Java/Kotlin | `pom.xml`, `build.gradle` | `checkstyle.xml`, `.editorconfig` | `gradle test`, `mvn test` |

**Implementation:** Add a `detectPrimaryLanguage()` function in `detection.ts`. Scoring functions branch on detected language for linter/CI checks.

**Success criteria:** `reins audit` produces meaningful scores for Python, Ruby, Go, and Rust repos — not just JS/TS.

### WS9: Address Tech Debt TD-005 — Plugin System Foundation

**Current state:** No plugin system for custom audit dimensions. TD-005 is open.

**Stripe-informed insight:** Stripe's specialization advantage comes from custom tooling. A plugin system lets teams add domain-specific audit checks.

**Minimal plugin interface:**
```typescript
interface ReinsPlugin {
  name: string;
  dimension: string; // must be one of the 6 existing dimensions
  check(targetDir: string): { score: number; max: number; findings: string[] };
}
```

**Discovery:** `reins audit` looks for `.reins/plugins/*.ts` (or `.js`) files. Each exports a `ReinsPlugin`. Plugin scores are added to the relevant dimension's findings (not to the main score — plugins are advisory in v1).

**Success criteria:** Teams can write a `.reins/plugins/my-check.ts` file and see its output in `reins audit`.

### WS10: Address Tech Debt TD-006 — Compare Command

**Current state:** Missing compare/watch/self-correct commands. TD-006 is open.

**Stripe-informed insight:** Stripe iterates with agents by providing feedback after PRs. A `reins compare` command enables before/after audit comparison.

**Command:** `reins compare <baseline.json> <path>`
- Runs fresh audit against `<path>`
- Diffs scores against `<baseline.json>` (previously saved audit output)
- Outputs: which dimensions improved, regressed, or stayed flat

**Success criteria:** `reins compare old-audit.json .` shows score deltas with directional indicators.

---

## Maturity Score Adjustment

With P0 changes (WS1-WS3), max score increases from 18 to 21. Maturity thresholds need recalibration:

| Level | Current Threshold | Proposed Threshold | Rationale |
|-------|------------------|--------------------|-----------|
| L0: Manual | ≤4 | ≤5 | Proportional increase |
| L1: Inloop | ≤8 | ≤10 | Proportional increase |
| L2: Guided Outloop | ≤13 | ≤15 | Proportional increase |
| L3: Full Outloop | ≤16 | ≤18 | Proportional increase |
| L4: Zero Touch | >16 | >18 | Highest bar |

**Important:** This is a breaking change for consumers comparing scores across versions. The `reins audit` output should include a `schema_version` field so consumers can detect which scoring model produced the result.

---

## Implementation Order

```
Phase 1 (P0): WS1 + WS2 + WS3 → deeper sub-checks in 3 dimensions
              + score threshold recalibration + schema_version field
              Ship as reins-cli v0.2.0

Phase 2 (P1): WS4 + WS5 + WS6 → maturity language + ZTE findings + evolve paths
              Ship as reins-cli v0.2.1

Phase 3 (P2): WS7-WS10 → tech debt resolution + new features
              Ship as reins-cli v0.3.0
```

---

## Relationship to Active Plans

- **Skill Eval and Shell Hardening** (active plan): Complementary. That plan focuses on skill quality and evals. This plan focuses on CLI audit depth. No conflicts. WS4-WS6 changes should be covered in skill eval prompt sets.

---

## What We're NOT Doing (Anti-Scope)

- NOT adding AST analysis (stays file-detection + content regex)
- NOT adding network calls during audit
- NOT adding runtime dependency checking
- NOT building a full tool shed — just detecting if one exists
- NOT implementing agent sandboxes — just detecting sandbox readiness signals
- NOT building Stripe's 500-MCP infrastructure — detecting MCP config presence
- NOT changing the 6-dimension model — deepening within it
