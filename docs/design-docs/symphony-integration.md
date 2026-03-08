<!-- Verified: 2026-03-08 -->
# Symphony Integration

## Decision

Reins detects orchestration patterns generically rather than coupling to any specific framework. Symphony's patterns (WORKFLOW.md, composable skills directories, workspace isolation, concurrency governance, proof-of-work gates) are detected as universal readiness signals.

## Context

OpenAI released Symphony (March 2026), an Elixir-based autonomous coding orchestration framework. Analysis revealed significant conceptual overlap between Reins' harness engineering and Symphony's conductor pattern. Both share the "humans steer, agents execute" philosophy.

## Changes

- **Scoring**: `agent_workflow` dimension expanded from max 4 to max 5, adding orchestration readiness (3+ of: workflow config, skills directory, isolation policy, concurrency limits, merge protection)
- **Detection**: New signals in `context.ts` — `hasWorkflowConfig`, `hasSkillsDirectory`, `hasIsolationPolicy`, `hasConcurrencyLimits`, `hasMergeProtection`, `hasSpecDocument`, `frameworksDetected`
- **Doctor**: 3 new health checks for workflow config, skills directory, merge protection
- **Evolve**: New steps at L1->L2 (workflow config), L2->L3 (skills composition), L3->L4 (workspace isolation)
- **Init**: Scaffolds WORKFLOW.md and SPEC.md templates
- **Output**: New `frameworks_detected` informational field in audit output
- **Total max score**: 22 (was 21)

## Trade-offs

- **For**: Framework-agnostic detection catches Symphony AND any future framework using the same patterns
- **Against**: Score recalibration required (maturity thresholds adjusted by +1 per level)
- **Mitigated**: Zero runtime dependencies added; all detection is filesystem-only
