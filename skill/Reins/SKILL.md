---
name: Reins
description: Reins CLI skill for scaffold/audit/doctor/evolve workflows. Use when setting up or evaluating harness-engineering repo readiness and maturity with Reins commands.
---

# Reins

Use the Reins CLI to operationalize harness engineering in any repository.

## Use When

Use this skill when the user asks to:
- Scaffold repository readiness artifacts (`AGENTS.md`, `ARCHITECTURE.md`, `docs/`, `risk-policy.json`)
- Audit or score agent-readiness/maturity (0-18, maturity levels, weakest dimensions)
- Diagnose readiness gaps with `doctor`
- Evolve the repository to the next Reins maturity level
- Improve docs-drift/policy-as-code enforcement tied to Reins outputs

## Don't Use When

Do not use this skill for:
- Generic code implementation/debugging unrelated to Reins workflows
- General-purpose lint/test/security checks that do not request Reins scoring or scaffolding
- Product/domain feature design that does not involve harness-engineering structure
- Questions about installing random third-party skills (use skill discovery/installer flows instead)

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
| audit, score, assess, doctor, health check, readiness diagnosis | Audit | Workflows/Audit.md |
| evolve, improve, mature, level up | Evolve | Workflows/Evolve.md |

## Examples

- "Scaffold this repo for Reins"
- "Audit this project with Reins and summarize the weakest dimensions"
- "Evolve this repo to the next Reins maturity level"

## Negative Examples

These should not trigger Reins:
- "Fix this React hydration bug"
- "Add OAuth login to the API"
- "Run normal project lint and unit tests"

Route to general coding workflows unless the user explicitly asks for Reins scaffolding, audit, doctor, or evolve operations.
