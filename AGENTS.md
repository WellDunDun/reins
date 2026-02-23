# AGENTS.md

## Repository Overview

reins — Open-source CLI that operationalizes harness engineering. Scaffold, audit, evolve, and doctor any project's agent-readiness. Zero dependencies, Bun-powered.

## Product Model (Must Keep Clear)

- `cli/reins` is the product engine. It is the only source of truth for readiness scoring and JSON outputs.
- `skill/Reins` is the control-plane wrapper for coding agents. It decides when/how to call CLI commands and how to parse results.
- Humans steer outcomes. Agents execute the loop using Reins outputs.
- Reins exists to transfer proven harness patterns into any repo so agents can become more autonomous and consistent over time.

When updating docs or workflows, preserve this separation explicitly. Do not duplicate scoring logic in the skill layer.

## Architecture

See ARCHITECTURE.md for domain map, module structure, and dependency rules.

## Documentation Map

| Topic | Location | Status |
|-------|----------|--------|
| Architecture | ARCHITECTURE.md | Current |
| CLI Source | cli/reins/src/index.ts | Current |
| CLI Modules | cli/reins/src/lib/ | Current |
| CLI Commands | cli/reins/src/lib/commands/ | Current |
| Audit Engine | cli/reins/src/lib/audit/ | Current |
| CLI Tests | cli/reins/src/index.test.ts | Current |
| Claude Skill | skill/Reins/SKILL.md | Current |
| Harness Methodology | skill/Reins/HarnessMethodology.md | Current |
| Skill Workflows | skill/Reins/Workflows/ | Current |
| Design Docs | docs/design-docs/index.md | Current |
| Core Beliefs | docs/design-docs/core-beliefs.md | Current |
| Ecosystem Positioning | docs/design-docs/ecosystem-positioning.md | Current |
| Product Specs | docs/product-specs/index.md | Current |
| Active Plans | docs/exec-plans/active/ | Current |
| Completed Plans | docs/exec-plans/completed/ | Current |
| Technical Debt | docs/exec-plans/tech-debt-tracker.md | Current |
| Risk Policy | risk-policy.json | Current |
| Golden Principles | docs/golden-principles.md | Current |
| CI Pipeline | .github/workflows/ci.yml | Current |
| Publish Pipeline | .github/workflows/publish.yml | Current |
| Version Bump Pipeline | .github/workflows/auto-bump-cli-version.yml | Current |

## Development Workflow

1. Receive task via prompt
2. Read this file, then follow pointers to relevant docs
3. Keep CLI command routing in `cli/reins/src/index.ts`; put reusable internals in `cli/reins/src/lib/` (especially `lib/commands/` and `lib/audit/`)
4. Run tests: `cd cli/reins && bun test`
5. Self-audit: `cd cli/reins && bun src/index.ts audit ../..`
6. Self-review changes for correctness and style
7. Open PR with concise summary

## Key Constraints

- Zero external runtime dependencies — stdlib only (fs, path)
- Single entrypoint CLI at `cli/reins/src/index.ts` with shared internals in `cli/reins/src/lib/`
- All commands output deterministic JSON
- Tests are co-located (`index.test.ts` next to `index.ts`)
- All knowledge lives in-repo, not in external tools
- Bun is the runtime; Node.js/tsx fallback via `bin/reins.cjs`

## Golden Principles

See docs/golden-principles.md for the full set of mechanical taste rules.
