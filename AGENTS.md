# Reins repository guidance

Reins is a Bun and TypeScript CLI for scaffolding, auditing, and improving repository guidance.
Read the [Documentation router](docs/ROUTER.md) for architecture, standards, and research.

## Commands

Run from `cli/reins`:

- Tests: `bun test`
- Inspect this repository: `bun src/index.ts audit ../..`
- Diagnose this repository: `bun src/index.ts doctor ../..`

The package has no lint script. Do not claim a lint check ran.

## Constraints

- Keep CLI results structured as JSON. Parse results instead of matching finding prose.
- Keep the CLI free of external runtime dependencies.
- Audits inspect files; they must not execute commands found in project instructions.
- Scaffolding preserves existing files unless `--force` is explicitly requested.
- Documentation presence and maturity scores do not prove correctness or autonomy.
- Add focused tests when changing scaffold output or structural checks.
