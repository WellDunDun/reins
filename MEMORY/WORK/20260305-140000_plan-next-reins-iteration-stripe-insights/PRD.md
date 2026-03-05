---
task: Plan next Reins iteration from Stripe insights
slug: 20260305-140000_plan-next-reins-iteration-stripe-insights
effort: standard
phase: complete
progress: 11/11
mode: interactive
started: 2026-03-05T14:00:00-05:00
updated: 2026-03-05T14:03:00-05:00
---

## Context

Daniel reviewed IndyDevDan's extract-wisdom analysis of Stripe's Minions agentic engineering system. Stripe ships 1,300 PRs/week with zero human-written code using blueprint engines, conditional rule files, a tool shed meta-tool for 500 MCPs, and dedicated agent sandboxes. The extract includes a REINS RELEVANCE MAPPING table showing direct connections between Stripe concepts and current/potential Reins features.

Current Reins state: 4 commands (init, audit, evolve, doctor), 6 audit dimensions scoring 0-18, maturity levels L0-L4, zero-dependency Bun CLI. Open tech debt: TD-002 (file-existence-only heuristics), TD-003 (JS/TS only), TD-005 (no plugin system), TD-006 (missing compare/watch/self-correct), TD-008 (no skill evals). One active exec plan for skill eval and shell hardening.

The task is to produce a concrete iteration plan that maps Stripe's validated patterns to Reins improvements.

### Risks

- Scope creep: Stripe operates at massive scale (100M+ LOC, 500 MCPs) — Reins serves smaller teams and must not over-engineer
- Architecture fit: new audit dimensions must stay file-detection-based (no AST, no network, zero deps)
- Maturity model integrity: changing L0-L4 levels risks breaking existing evolve paths

## Criteria

- [x] ISC-1: Plan identifies 3+ new audit sub-checks derived from Stripe research
- [x] ISC-2: Each new sub-check has specific scoring signals (file patterns, config keys)
- [x] ISC-3: Plan addresses open tech debt TD-002 through TD-008
- [x] ISC-4: Plan includes updated maturity model language for inloop/outloop
- [x] ISC-5: Plan proposes ZTE readiness indicators for L4
- [x] ISC-6: Plan addresses blueprint/workflow pattern detection
- [x] ISC-7: Plan addresses conditional context engineering scoring
- [x] ISC-8: Plan addresses tool registry/discoverability scoring
- [x] ISC-9: Plan fits zero-dependency Bun architecture constraints
- [x] ISC-10: Plan prioritizes items as P0/P1/P2 with ordering
- [x] ISC-11: Plan includes success criteria for each major workstream

## Decisions

- Deepen existing 6 dimensions rather than adding new ones — preserves JSON contract, keeps 6-dimension model clean
- Increase per-dimension max from 3 to 4 for 3 dimensions (agent_workflow, repository_knowledge, agent_legibility) — total max becomes 21
- ZTE signals are findings-only (informational), not scored points — avoids premature scoring of aspirational patterns
- Score threshold recalibration needed when max changes — include schema_version field for consumers
- FirstPrinciples decomposition confirmed: only 3 of Stripe's 5 primitives yield statically-measurable signals

## Verification

Plan written to `docs/exec-plans/active/next-iteration-stripe-informed.md` with 10 workstreams across P0/P1/P2 priorities.
