# Technical Debt Tracker

Track known technical debt with priority and ownership.

| ID | Description | Domain | Priority | Status | Created | Updated |
|----|-------------|--------|----------|--------|---------|---------|
| TD-001 | Single-file CLI (1767 lines) could be modularized | CLI | Medium | Open | 2026-02-22 | 2026-02-22 |
| TD-002 | Audit heuristics are file-existence only, no AST analysis | CLI | Medium | Open | 2026-02-22 | 2026-02-22 |
| TD-003 | No language support beyond JS/TS ecosystems | CLI | High | Open | 2026-02-22 | 2026-02-22 |
| TD-004 | Observability check not meaningful for CLI tools (resolved via CLI diagnosability scoring) | CLI | Low | Closed | 2026-02-22 | 2026-02-22 |
| TD-005 | No plugin system for custom audit dimensions | CLI | Medium | Open | 2026-02-22 | 2026-02-22 |
| TD-006 | Missing compare/watch/self-correct commands | CLI | Medium | Open | 2026-02-22 | 2026-02-22 |
| TD-007 | Biome lint baseline too high for blocking CI gate (baseline reduced; CI gate flip still pending) | CLI | Medium | Open | 2026-02-22 | 2026-02-22 |
| TD-008 | No automated skill eval suite for trigger quality and command behavior | Skill | High | Open | 2026-02-22 | 2026-02-22 |

## Priority Definitions

- **Critical**: Actively causing bugs or blocking features
- **High**: Will cause problems soon, should address this sprint
- **Medium**: Noticeable drag on velocity, schedule for cleanup
- **Low**: Minor annoyance, address opportunistically

## Process

1. New debt discovered → add row here
2. Background agents scan weekly for new debt
3. Cleanup PRs opened targeting highest priority items
4. Resolved debt marked as "Closed" with resolution date
