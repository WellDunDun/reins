---
name: HarnessEngineering
description: Agent-first development methodology. USE WHEN harness engineering, agent-first, scaffold project, audit codebase, zero manual code, agents.md, repository knowledge, agent legibility.
---

# HarnessEngineering

Apply the Harness Engineering methodology — building and shipping software with zero manually-written code, where humans steer and agents execute.

## Customization Check

Before executing any workflow, check for user customizations:
- `~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/HarnessEngineering/`
- Load PREFERENCES.md if present

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the WORKFLOWNAME workflow in the HarnessEngineering skill to ACTION"}' \
  > /dev/null 2>&1 &
```

## Core Principles

1. **Humans steer, agents execute** — No manually-written code. Every line by agents.
2. **Repository is the system of record** — All knowledge versioned in-repo, not in Slack/Docs.
3. **Progressive disclosure** — Short AGENTS.md as map; deep docs elsewhere.
4. **Agent legibility over human legibility** — Optimize for agent reasoning first.
5. **Enforce invariants, not implementations** — Linters and structural tests, not code review.
6. **Garbage collection** — Recurring agents clean drift; pay down debt continuously.
7. **Corrections are cheap, waiting is expensive** — Minimal blocking merge gates.

For the full methodology reference, run: `SkillSearch('harness methodology')`

## Workflow Routing

| Trigger | Workflow | File |
|---------|----------|------|
| scaffold, init, setup, new project, bootstrap | Scaffold | Workflows/Scaffold.md |
| audit, score, assess, check, evaluate | Audit | Workflows/Audit.md |
| evolve, improve, upgrade, mature, level up | Evolve | Workflows/Evolve.md |

## Examples

- "Scaffold a harness engineering project in this repo"
- "Audit this codebase against harness engineering principles"
- "Evolve this project to the next harness maturity level"
