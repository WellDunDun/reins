# Technical Debt Tracker

Track known technical debt with priority and ownership.

| ID | Description | Domain | Priority | Status | Created | Updated |
|----|-------------|--------|----------|--------|---------|---------|
| TD-001 | Example: implement dependency linter | Core | High | Open | 2026-02-22 | 2026-02-22 |

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
