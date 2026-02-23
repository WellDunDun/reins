# Architecture — reins

## Domain Map

| Domain | Description | Quality Grade |
|--------|-------------|---------------|
| CLI | Command-line tool: init, audit, evolve, doctor | B |
| Skill | Claude Code skill integration and workflows | B |
| Docs | In-repo knowledge base (golden principles, beliefs, specs) | A |

## Module Structure

reins uses a single CLI entrypoint with modular internals.

```
cli/reins/src/
  index.ts                 # CLI router + command orchestration
  index.test.ts            # End-to-end command tests
  lib/
    commands/
      init.ts              # init command handler
      audit.ts             # audit scoring + command output
      doctor.ts            # doctor checks + command output
      evolve.ts            # evolve command handler
    audit/
      context.ts           # audit runtime context and repo signal collection
      scoring.ts           # scoring functions and maturity resolution
    types.ts               # Shared CLI domain types
    templates.ts           # Scaffold/templates for docs/scripts/workflows
    filesystem.ts          # Safe file walking and discovery helpers
    detection.ts           # Workflow/CLI/monorepo signal detection
    automation-pack.ts     # Pack normalization/recommendation/scaffolding
    scoring-utils.ts       # Shared scoring helpers
```

### Dependency Direction

Forward-only between modules:

```
lib/helpers + lib/commands → index.ts router → CLI output
```

- `lib/*` modules are reusable helpers with narrow responsibilities
- `lib/commands/*` own command semantics and JSON response contracts
- `index.ts` focuses on argument parsing and routing only

### Skill Structure

```
skill/Reins/
  SKILL.md              → Routing and configuration
  HarnessMethodology.md → Full methodology reference
  Workflows/
    Scaffold.md         → Scaffold workflow guide
    Audit.md            → Audit workflow guide
    Evolve.md           → Evolve workflow guide
```

### Enforcement

These rules are enforced mechanically:
- [x] Biome linter for code formatting and style
- [x] CI gate runs tests and self-audit on every push/PR
- [ ] Custom structural tests for layer violations (future)

## Quality Grades

| Grade | Meaning |
|-------|---------|
| A | Well-tested, documented, stable |
| B | Functional, tested, room for improvement |
| C | Works but needs attention |
| D | Technical debt, needs refactoring |
