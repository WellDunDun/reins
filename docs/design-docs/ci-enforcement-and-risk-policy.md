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

3. Publish on merge to master only when a new version is present.
`.github/workflows/publish.yml` runs on every push to `master`:
- Runs the full test suite as a prerequisite (`needs: test`)
- Compares local version to published npm version
- If the version is already published, skips release work
- If the version is new, publishes `reins-cli` to npm
- Creates a GitHub Release with auto-generated release notes
- Version bumps happen in pull requests, not in the publish workflow

4. Workflow enforcement detection should avoid false positives.
CLI workflow scanning no longer uses broad substring matching (e.g. `"check"` matching `actions/checkout`).
It now uses explicit regex patterns for gates like `lint`, `test`, and `typecheck`.

5. CLI versioning is auto-bumped during PRs when CLI code changes.
`.github/workflows/auto-bump-cli-version.yml` runs on pull requests that touch `cli/reins/**`:
- Compares `cli/reins/package.json` version in base vs head
- If unchanged, bumps patch version and syncs root `package.json`
- Commits and pushes the bump to the PR branch for same-repo PRs
- Skips push behavior for fork PRs

## Rationale

- Policy-as-code provides deterministic governance signals for audits and doctor checks.
- Explicit CI gates make audit scoring reproducible and mechanically verifiable.
- False-positive-resistant detection prevents inflated audit scores.
- Publish-on-merge is compatible with protected branches while still automating npm/GitHub releases.
- PR-time version bumping preserves protected-branch constraints while reducing missed releases.

## Consequences

- The self-audit score improved because governance and CI depth are now explicit.
- CLI projects can satisfy the legibility observability signal with strong diagnosability evidence instead of irrelevant service observability infrastructure.
- Lint baseline has been reduced and now passes cleanly in local checks; CI lint remains advisory until the workflow flips the gate to blocking.
- Merges to master only publish when the merged PR already includes a new package version.
- Requires npm Trusted Publisher configuration for this GitHub repository/workflow (OIDC), not a long-lived `NPM_TOKEN`.
- Fork PRs may still require maintainer follow-up for version bump commits.
