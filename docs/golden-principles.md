# Golden Principles

Opinionated mechanical rules that encode human taste. These go beyond standard linters and are enforced in CI.

## Structural Rules

1. **Shared utilities over hand-rolled helpers**
   Centralize invariants in shared packages. Never duplicate utility logic across domains.

2. **Validate at boundaries, never YOLO**
   Parse and validate all external data at system boundaries. Use typed SDKs. Never access unvalidated shapes.

3. **Boring technology preferred**
   Choose composable, stable, well-documented dependencies. Prefer libraries well-represented in LLM training data. Reimplement simple utilities rather than pulling opaque dependencies.

4. **Single source of truth**
   Every piece of knowledge has exactly one canonical location. If it's duplicated, one copy is a reference to the other.

## Naming Conventions

- Files: kebab-case (`user-service.ts`)
- Types/Interfaces: PascalCase (`UserProfile`)
- Functions/Variables: camelCase (`getUserProfile`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Domains: kebab-case directories (`app-settings/`)

## Code Style

- Prefer explicit over implicit
- No magic strings — use enums or constants
- Error messages must be actionable (what happened, what to do)
- Functions do one thing
- No nested ternaries
- Prefer early returns over deep nesting

## Testing Rules

- Every public function has at least one test
- Tests are co-located with source (`*.test.ts` next to `*.ts`)
- Test names describe the expected state, not the action
- No test interdependence — each test is isolated

## Documentation Rules

- Every design decision is documented with rationale
- Docs are verified against code on a recurring cadence
- Stale docs are worse than no docs — delete or update

## Review Rules

- Agent reviews check: layer violations, golden principle adherence, test coverage
- Human reviews focus on: intent alignment, architectural fit, user impact
- Nit-level feedback is captured as golden principle updates, not blocking comments

## CI Enforcement Strategy

- CI should include explicit gates for `lint`, `test`, `typecheck`, and repo self-`audit`.
- If lint debt exists, run lint as advisory first, then ratchet to blocking once baseline is reduced.
- Enforcement checks should prefer explicit patterns over broad keyword matching to avoid false positives.
