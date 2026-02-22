# Skill Eval and Shell Hardening Plan

Created: 2026-02-22  
Owner: Team  
Status: Active

## Objective

Make the Reins skill reliably routable and measurable by adding evals for trigger behavior and command execution quality, then document a safe shell posture for hosted environments.

## Why Now

Skill quality currently depends on manual spot-checking. That makes routing regressions and command thrashing hard to catch early.

Recent OpenAI guidance emphasizes:
- small prompt-set evals with explicit `should_trigger` coverage,
- deterministic grading from `codex exec --json` traces,
- rubric-based structured grading via `--output-schema`,
- clear skill routing boundaries (`Use when` / `Don't use when`),
- careful containment when shell and networking are combined.

## Scope

1. Reins skill routing quality
2. Reins skill eval harness (deterministic + rubric)
3. Optional CI integration for eval runs
4. Hosted-shell security guidance for teams that run Reins in cloud containers

## Non-Goals

1. Rewriting Reins as a hosted-only product
2. Adding mandatory networked shell usage for local CLI workflows
3. Blocking release on heavyweight end-to-end evals

## Workstreams

### WS1: Tighten Skill Routing Contract

Deliverables:
- `skill/Reins/SKILL.md` has explicit:
  - `Use when`
  - `Don't use when`
  - outputs/success criteria
- Negative examples and edge cases for adjacent requests that should not trigger Reins.

Success criteria:
- Fewer false-positive skill triggers in prompt-set evals.

### WS2: Deterministic Skill Evals

Deliverables:
- `evals/reins.prompts.csv` with `id,should_trigger,prompt`.
- Deterministic runner that captures JSONL traces from `codex exec --json`.
- Graders for:
  - expected command invocation,
  - required artifact checks,
  - command count/thrashing guardrails.

Success criteria:
- Regressions produce explainable failures from structured trace events.

### WS3: Rubric-Based Qualitative Checks

Deliverables:
- `evals/reins-rubric.schema.json`.
- Read-only rubric evaluation pass that returns schema-constrained JSON.

Success criteria:
- Style/convention regressions are scored consistently and machine-parseable.

### WS4: CI Integration

Deliverables:
- Optional eval CI job (manual or nightly trigger initially).
- Artifact retention for JSONL traces and rubric outputs.

Success criteria:
- Team can run eval suite in CI without blocking normal contributor velocity.

### WS5: Shell + Network Safety Guidance

Deliverables:
- Docs guidance for hosted shell usage:
  - minimal allowlists,
  - request-scoped network policy,
  - `domain_secrets` for auth,
  - artifact handoff conventions.

Success criteria:
- Security posture is explicit for teams using hosted shell + network access.

## Milestones

1. M1: Plan + docs approved
2. M2: Prompt set + deterministic runner in repo
3. M3: Rubric schema + qualitative pass
4. M4: CI job and artifact workflow
5. M5: Hosted-shell security docs merged

## Risks

1. Overfitting to narrow prompts instead of real workflows
2. Making evals too heavy and slowing iteration
3. Mixing local-first and hosted-shell guidance without clear boundaries

## Mitigations

1. Grow prompt set from real misses and production-like prompts.
2. Keep deterministic checks fast; run heavier checks on schedule.
3. Clearly separate local CLI defaults from hosted-shell optional guidance.

## References

1. https://developers.openai.com/blog/eval-skills/
2. https://developers.openai.com/blog/skills-shell-tips
