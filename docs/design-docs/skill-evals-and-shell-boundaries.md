# Skill Evals and Shell Boundaries

## Context

Reins now ships as both:
1. A CLI (`reins-cli`)
2. An installable skill (`npx skills add WellDunDun/reins`)

The CLI is deterministic JSON output. The skill layer is still instruction-driven and can drift if not continuously evaluated.

## Problem

Without skill-focused evals:
1. Trigger routing can regress (`should_trigger` and false triggers).
2. Command behavior can become noisy (extra commands, wrong command order).
3. Qualitative response quality is hard to enforce consistently.

Without explicit shell/network boundaries:
1. Teams may copy hosted-shell guidance into local-only contexts.
2. Security posture around networked shell use becomes implicit instead of deliberate.

## Decision 1: Treat Skill Quality as a First-Class Test Surface

We will add a dedicated eval harness under `evals/` for the Reins skill.

Design:
1. Prompt fixture set with `id, should_trigger, prompt`.
2. Deterministic checks from `codex exec --json` traces.
3. Structured qualitative grading with an explicit output schema.

Rationale:
1. Trigger precision and command behavior are measurable.
2. JSON traces make failures inspectable and debuggable.
3. Rubric outputs remain machine-readable for CI and trend tracking.

## Decision 2: Keep Local CLI Defaults, Document Hosted Shell as Optional

Reins remains local-first by default. Hosted shell guidance is documented as optional.

Local-first default:
1. Run local source inside this repo when available.
2. Otherwise use `npx reins-cli ...`.
3. Prefer deterministic JSON parsing for all command outputs.

Hosted-shell optional guidance:
1. Minimize allowed domains.
2. Use request-scoped secrets (`domain_secrets` model).
3. Treat file artifacts as explicit handoff boundaries.

Rationale:
1. Most Reins use cases are local repo workflows.
2. Hosted shell can be powerful but raises security and policy complexity.

## Decision 3: Clarify Routing Boundaries in SKILL.md

Reins SKILL instructions should explicitly include:
1. `Use when`
2. `Don't use when`
3. Negative examples and edge prompts

Rationale:
1. Better trigger precision and fewer false positives.
2. Cleaner separation from adjacent general-purpose coding tasks.

## Consequences

Positive:
1. Skill behavior becomes testable and trackable over time.
2. Failures become actionable via structured traces and rubric scores.
3. Security posture is explicit where shell/network integration exists.

Trade-offs:
1. Evals require fixture maintenance as prompts evolve.
2. CI integration must stay lightweight to avoid contributor friction.

## Related Plan

See `docs/exec-plans/active/skill-eval-and-shell-hardening.md`.

## References

1. https://developers.openai.com/blog/eval-skills/
2. https://developers.openai.com/blog/skills-shell-tips
