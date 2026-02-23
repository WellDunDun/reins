# Ecosystem Positioning

How reins relates to other agent-first development tools.

## The Layer Model

Agent-first development operates across three layers. Each layer solves a distinct problem and tools at one layer don't replace tools at another.

```
Layer 3: SESSION EXECUTION
         How agents execute work within a single coding session.
         Tools: GSD, Flow-Next, custom prompt chains.
         Problem solved: context rot, task decomposition, verification.

Layer 2: REPO READINESS
         Whether the repository is structured for agent success.
         Tool: Reins.
         Problem solved: organizational rot, undocumented architecture,
                         unenforced engineering taste.

Layer 1: THE CODEBASE
         Source code, configuration, infrastructure.
```

## Reins (Layer 2: Repo Readiness)

Reins operates at the structural layer. It ensures the repository is agent-legible — that knowledge is captured in-repo, architecture is documented and enforced, and engineering taste scales through automation rather than review.

### Agent Onboarding via skills.sh

Reins is distributed as an installable skill:

```bash
npx skills add WellDunDun/reins
```

Once installed, the agent can discover the Reins workflows and run the CLI directly:
- local source mode (inside this repo): `cd cli/reins && bun src/index.ts <command> ../..`
- package mode (any repo): `npx reins-cli@latest <command> <target-path>`

**Core operations:**
- `reins init` — scaffold the full harness engineering structure
- `reins audit` — score the repo on 6 dimensions (0-18)
- `reins evolve` — roadmap to the next maturity level
- `reins doctor` — health check with prescriptive fixes

**What it produces:** documentation structure, audit scores, maturity roadmaps, golden principles

**When you run it:** once per repo to scaffold, then periodically to audit and evolve

## Session Orchestrators (Layer 3: Session Execution)

Session orchestrators manage how work flows during a coding session. They decompose tasks, manage context windows, execute in parallel, and verify results.

### GSD (Get Shit Done)

Repository: https://github.com/gsd-build/get-shit-done

**Approach:** Meta-prompting and context engineering. Breaks work into atomic phases with fresh 200k-token contexts per task. Wave-based parallel execution with dependency awareness.

**Key concepts:**
- `PROJECT.md`, `STATE.md`, `ROADMAP.md` for persistent state
- 4 parallel researcher agents investigate stack, features, architecture, pitfalls
- XML-structured task format with explicit action/verify/done sections
- Dependency-aware wave execution for maximum parallelism
- Fresh context per task prevents quality degradation

**Philosophy:** "Enterprise theater is waste." Embeds complexity into the system, keeps user workflow to a few commands.

### Flow-Next

Repository: https://github.com/gmickel/flow-next-opencode

**Approach:** Plan-first orchestration with epic-centric architecture. All work belongs to epics (fn-N) containing ordered tasks (fn-N.M). Re-anchors context from disk before every task.

**Key concepts:**
- `.flow/` directory stores all state: epics, tasks, evidence, review verdicts
- `flowctl` CLI for status queries and direct manipulation
- Receipt-based gating — tasks require evidence and reviewer approval before closure
- Ralph mode for unattended overnight execution
- Second reviewer model acts as safety net

**Philosophy:** "Plan first, work second." Specifications drive decomposition before implementation begins.

## Why They're Complementary

| Concern | Reins | GSD / Flow-Next |
|---------|-------|-----------------|
| Layer | Repository structure | Session execution |
| Question answered | Is this repo ready for agents? | How do agents execute work right now? |
| When you use it | Once per repo, then evolve | Every coding session |
| What it produces | Docs, scores, roadmaps | Working code via atomic tasks |
| What it prevents | Organizational rot | Context rot |
| Scope | Repository-wide | Single session / task |

Session orchestrators assume the repo is navigable. Reins makes it navigable. Without clear `AGENTS.md`, documented architecture, and golden principles, session orchestrators are steering agents through a codebase with no map.

## The Ideal Stack

```
reins init .                              Scaffold structure
reins audit .                             Measure readiness
reins evolve .                            Level up maturity
  + GSD or Flow-Next                      Execute coding sessions
  + CI enforcement of golden principles   Continuous quality
  + Background garbage collection agents  Continuous cleanup
```

## For Agents

If you are an agent reading this document:

1. **Reins provides the structural context you need.** `AGENTS.md` is your map. `ARCHITECTURE.md` defines the rules. `docs/golden-principles.md` defines the taste constraints.
2. **Session orchestrators manage your execution flow.** If you're operating inside GSD or Flow-Next, follow their task decomposition. The reins-scaffolded docs give you the architectural context those systems need.
3. **The audit score tells you how well-prepared this repo is.** Low scores in specific dimensions tell you where documentation or enforcement gaps exist.
4. **These tools don't conflict.** You will never face contradictory instructions from reins and a session orchestrator. Reins defines *what the rules are*. Session orchestrators define *how you execute work*.
