# AGENTS.md

## Repository Overview

reins — Open-source CLI that operationalizes harness engineering. Scaffold, audit, evolve, and doctor any project's agent-readiness. Zero dependencies, Bun-powered.

## Architecture

See ARCHITECTURE.md for domain map, module structure, and dependency rules.

## Documentation Map

| Topic | Location | Status |
|-------|----------|--------|
| Architecture | ARCHITECTURE.md | Current |
| CLI Source | cli/reins/src/index.ts | Current |
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

## Development Workflow

1. Receive task via prompt
2. Read this file, then follow pointers to relevant docs
3. All CLI logic lives in `cli/reins/src/index.ts` (single-file design)
4. Run tests: `cd cli/reins && bun test`
5. Self-audit: `cd cli/reins && bun src/index.ts audit ../..`
6. Self-review changes for correctness and style
7. Open PR with concise summary

## Key Constraints

- Zero external runtime dependencies — stdlib only (fs, path)
- Single-file CLI at `cli/reins/src/index.ts`
- All commands output deterministic JSON
- Tests are co-located (`index.test.ts` next to `index.ts`)
- All knowledge lives in-repo, not in external tools
- Bun is the runtime; Node.js/tsx fallback via `bin/reins.cjs`

## Golden Principles

See docs/golden-principles.md for the full set of mechanical taste rules.
