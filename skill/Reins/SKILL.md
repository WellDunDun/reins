---
name: Reins
description: Reins CLI skill for scaffold/audit/doctor/evolve workflows. USE WHEN harness engineering, AGENTS.md scaffolding, maturity scoring, risk-policy.json, docs drift, agent-readiness.
---

# Reins

Use the Reins CLI to operationalize harness engineering in any repository.

## Command Execution Policy

Use this order when running commands:

1. If working inside the Reins repository itself:
`cd cli/reins && bun src/index.ts <command> ../..`
2. Otherwise (or if local source is unavailable):
`npx reins-cli <command> <target-path>`

All Reins commands output deterministic JSON. Prefer parsing JSON output over text matching.

## Core Reins Principles

1. **Repository is the system of record** — Knowledge stays in versioned files.
2. **Humans steer, agents execute** — Prompt-first workflows over manual edits where possible.
3. **Mechanical enforcement over intent-only docs** — CI and policy-as-code back every rule.
4. **Progressive disclosure** — AGENTS.md is the map, deep docs hold details.
5. **Continuous cleanup** — Track debt, docs drift, and stale patterns as first-class work.

## Workflow Routing

| Trigger | Workflow | File |
|---------|----------|------|
| scaffold, init, setup, bootstrap | Scaffold | Workflows/Scaffold.md |
| audit, score, assess, doctor, check | Audit | Workflows/Audit.md |
| evolve, improve, mature, level up | Evolve | Workflows/Evolve.md |

## Examples

- "Scaffold this repo for Reins"
- "Audit this project with Reins and summarize the weakest dimensions"
- "Evolve this repo to the next Reins maturity level"
