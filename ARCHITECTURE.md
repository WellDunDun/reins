# Architecture — reins

## Domain Map

| Domain | Description | Quality Grade |
|--------|-------------|---------------|
| CLI | Command-line tool: init, audit, evolve, doctor | B |
| Skill | Claude Code skill integration and workflows | B |
| Docs | In-repo knowledge base (golden principles, beliefs, specs) | A |

## Module Structure

reins is a single-file CLI tool. The architecture is function-based, not layered.

```
cli/reins/src/index.ts
  |
  +-- Types (interfaces: AuditScore, AuditResult, InitOptions, EvolutionStep, EvolutionPath)
  +-- Templates (agentsMdTemplate, architectureMdTemplate, goldenPrinciplesTemplate, ...)
  +-- Commands (init, runAudit, audit, doctor, evolve)
  +-- CLI Router (main, printHelp, flag parsing)
```

### Dependency Direction

Forward-only within the file:

```
Types → Templates → Commands → CLI Router
```

- Types are pure interfaces, no imports
- Templates depend on nothing (return strings)
- Commands import Types, call Templates, use fs/path
- CLI Router calls Commands based on argv

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
