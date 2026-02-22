# CI Enforcement and Risk Policy

<!-- Verified: 2026-02-22 -->

This document captures how `reins` currently enforces quality gates and docs-drift policy on itself.

## Decisions

1. Policy-as-code is required.
`risk-policy.json` is tracked at repo root and defines:
- risk tiers (`low`, `medium`, `high`)
- `watchPaths` for change detection
- `docsDriftRules` linking code areas to required docs

2. CI quality gates must be explicit.
`.github/workflows/ci.yml` includes these gates:
- `lint` (currently advisory)
- `test`
- `typecheck`
- self-`audit`

3. Auto-publish on merge to master.
`.github/workflows/publish.yml` runs on every push to `master`:
- Runs the full test suite as a prerequisite (`needs: test`)
- Compares local version to published npm version
- Bumps patch version if they match (e.g. 0.1.1 → 0.1.2)
- Syncs root and CLI `package.json` versions
- Commits the bump with `[skip ci]` using `GITHUB_TOKEN` (prevents recursive triggers)
- Publishes `reins-cli` to npm
- Creates a GitHub Release with auto-generated release notes

3. Workflow enforcement detection should avoid false positives.
CLI workflow scanning no longer uses broad substring matching (e.g. `"check"` matching `actions/checkout`).
It now uses explicit regex patterns for gates like `lint`, `test`, and `typecheck`.

## Rationale

- Policy-as-code provides deterministic governance signals for audits and doctor checks.
- Explicit CI gates make audit scoring reproducible and mechanically verifiable.
- False-positive-resistant detection prevents inflated audit scores.
- Auto-publish eliminates manual release steps and ensures users always get the latest version via `npx reins-cli`.

## Consequences

- The self-audit score improved because governance and CI depth are now explicit.
- CLI projects can satisfy the legibility observability signal with strong diagnosability evidence instead of irrelevant service observability infrastructure.
- Lint remains advisory until the existing lint baseline is reduced to a level that can block merges safely.
- Every merge to master produces a versioned npm release, removing the manual publish bottleneck.
- Requires `NPM_TOKEN` secret in GitHub repo settings for npm authentication.
