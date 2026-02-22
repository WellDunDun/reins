# AGENTS.md

## Repository Overview

porto-v2 — [Brief description of the project].

## Architecture

See ARCHITECTURE.md for domain map, package layering, and dependency rules.

## Documentation Map

| Topic | Location | Status |
|-------|----------|--------|
| Architecture | ARCHITECTURE.md | Current |
| Design Docs | docs/design-docs/index.md | Current |
| Core Beliefs | docs/design-docs/core-beliefs.md | Current |
| Product Specs | docs/product-specs/index.md | Current |
| Active Plans | docs/exec-plans/active/ | Current |
| Completed Plans | docs/exec-plans/completed/ | Current |
| Technical Debt | docs/exec-plans/tech-debt-tracker.md | Current |
| Golden Principles | docs/golden-principles.md | Current |
| References | docs/references/ | Current |

## Development Workflow

1. Receive task via prompt
2. Read this file, then follow pointers to relevant docs
3. Implement changes following ARCHITECTURE.md layer rules
4. Run linters and structural tests (`bun run lint && bun run test`)
5. Self-review changes for correctness and style
6. Request agent review if available
7. Iterate until all reviewers satisfied
8. Open PR with concise summary

## Key Constraints

- Dependencies flow forward only: Types > Config > Repo > Service > Runtime > UI
- Cross-cutting concerns enter ONLY through Providers
- Validate data at boundaries — never probe shapes without validation
- Prefer shared utilities over hand-rolled helpers
- All knowledge lives in-repo, not in external tools

## Golden Principles

See docs/golden-principles.md for the full set of mechanical taste rules.
