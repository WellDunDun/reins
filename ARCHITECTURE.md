# Reins architecture

This document describes the local source inspected on 9 November 2026.

## Components

| Component | Ownership |
|-----------|-----------|
| `cli/reins/src/index.ts` | CLI dispatch, scaffold templates, legacy maturity scoring, doctor and evolve output |
| `cli/reins/src/instructions.ts` | Read-only instruction discovery, router validation, adapter and length checks |
| `cli/reins/src/index.test.ts` | CLI behavior tests, including scaffold preservation and JSON results |
| `cli/reins/src/instructions.test.ts` | Router resolution, nested scope, adapters, exclusions, and boundary cases |
| `cli/reins/bin/reins.cjs` | Distributed executable wrapper |
| `skill/Reins/` | Agent-facing Reins workflow guidance |
| `docs/ROUTER.md` | Task-oriented documentation entry point |

## Dependency boundaries

The CLI imports the instruction inspector. The inspector depends only on Node-compatible filesystem and path APIs and never imports the CLI dispatcher. Neither module adds external runtime dependencies.

The instruction inspector reads project text as data. It never executes documented commands or fetches external links. Validated local targets must resolve to files within the target repository. Directory symlinks are not traversed. These checks enforce navigation structure, not semantic instruction correctness.

## Commands and state

`init` writes missing scaffold files, with existing overwrite behavior gated by `--force`. `audit` reads repository evidence and emits legacy scores plus additive instruction checks. `doctor` reads the same structural checks and emits pass/fail/warn findings. `evolve --apply` can invoke scaffolding under its existing conditions.

Filesystem presence is the main evidence used by legacy maturity heuristics. A linter config does not prove architecture enforcement, and a workflow directory does not prove branch protection. These scoring limitations remain; the instruction-router change does not calibrate the maturity model.

## Verification

Run `bun test` from `cli/reins`. For a repository inspection, run `bun src/index.ts audit ../..` and `bun src/index.ts doctor ../..` from the same directory and parse their JSON. There is no lint or typecheck script defined in the package manifest.
