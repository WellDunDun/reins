# CLAUDE.md

## Project

reins — Harness Engineering CLI. Scaffold, audit, evolve, and doctor agent-readiness for any project.

## Quick Start

```bash
cd cli/reins
bun install
bun test                        # Run tests
bun src/index.ts audit ../..    # Self-audit
```

## Key Files

- `cli/reins/src/index.ts` — CLI router and command orchestration
- `cli/reins/src/lib/commands/` — Command handlers (init/audit/doctor/evolve)
- `cli/reins/src/lib/audit/` — Audit context and scoring internals
- `cli/reins/src/index.test.ts` — Test suite
- `AGENTS.md` — Repository map (start here)
- `ARCHITECTURE.md` — Domain map and structure

## Rules

- Zero external runtime dependencies
- All commands output deterministic JSON
- Tests co-located with source
- Run `bun test` before committing
- Self-audit with `bun src/index.ts audit ../..` to verify score
