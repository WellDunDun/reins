# Audit Workflow

Score an existing project against harness engineering principles. Produces a structured assessment with actionable recommendations.

## Audit Dimensions

Score each dimension 0-3:
- **0** = Not present
- **1** = Minimal/ad-hoc
- **2** = Structured but incomplete
- **3** = Fully implemented and enforced

### 1. Repository Knowledge (0-3)

| Check | Points |
|-------|--------|
| AGENTS.md exists (hierarchical: per-package AGENTS.md files detected in monorepos) | +1 |
| docs/ directory with indexed design docs (counts design decisions in design-docs/index.md) | +1 |
| Verification headers in docs (`<!-- Verified: DATE -->`) and execution plans versioned in-repo | +1 |

### 2. Architecture Enforcement (0-3)

| Check | Points |
|-------|--------|
| ARCHITECTURE.md with dependency direction rules defined | +1 |
| Linter enforcement depth (structural lint scripts, architectural rules in config) | +1 |
| Enforcement evidence (risk-policy.json, CI with lint/test steps, structural lint scripts) | +1 |

### 3. Agent Legibility (0-3)

| Check | Points |
|-------|--------|
| App bootable per worktree/branch (monorepo-aware: detects workspace packages, checks per-workspace bootability) | +1 |
| Observability accessible to agents (modern platforms: Sentry, Vercel, Netlify, Docker, local stacks) | +1 |
| Boring tech stack, minimal opaque dependencies (monorepo-aware: per-workspace average dependency count) | +1 |

### 4. Golden Principles (0-3)

| Check | Points |
|-------|--------|
| Documented mechanical taste rules (counts principles, detects anti-patterns section) | +1 |
| Rules enforced in CI with depth (counts distinct enforcement steps in CI workflows) | +1 |
| Recurring cleanup/refactoring process | +1 |

### 5. Agent Workflow (0-3)

| Check | Points |
|-------|--------|
| Agent config present (conductor.json, AGENTS.md, or equivalent) | +1 |
| Workflow signals (risk-policy.json, issue templates, agent review capability) | +1 |
| CI quality (requires 2+ distinct enforcement steps in workflows) | +1 |

### 6. Garbage Collection (0-3)

| Check | Points |
|-------|--------|
| Doc-gardener scripts and freshness automation (active GC detection) | +1 |
| Verification headers across docs (3+ files with `<!-- Verified: DATE -->`) | +1 |
| Docs-drift enforcement (risk-policy.json with watchPaths, quality grades per domain) | +1 |

## Maturity Levels

| Score | Level | Description |
|-------|-------|-------------|
| 0-4 | **L0: Manual** | Traditional engineering, no agent infrastructure |
| 5-8 | **L1: Assisted** | Agents help, but humans still write code |
| 9-13 | **L2: Steered** | Humans steer, agents execute most code |
| 14-16 | **L3: Autonomous** | Agents handle full lifecycle with human oversight |
| 17-18 | **L4: Self-Correcting** | Agents maintain, clean, and evolve the system |

## Output Format

```json
{
  "project": "project-name",
  "timestamp": "ISO-8601",
  "scores": {
    "repository_knowledge": { "score": 0, "max": 3, "findings": [] },
    "architecture_enforcement": { "score": 0, "max": 3, "findings": [] },
    "agent_legibility": { "score": 0, "max": 3, "findings": [] },
    "golden_principles": { "score": 0, "max": 3, "findings": [] },
    "agent_workflow": { "score": 0, "max": 3, "findings": [] },
    "garbage_collection": { "score": 0, "max": 3, "findings": [] }
  },
  "total_score": 0,
  "max_score": 18,
  "maturity_level": "L0",
  "recommendations": []
}
```

## Steps

1. Read project root for AGENTS.md, ARCHITECTURE.md, docs/
2. Score each dimension by checking for artifacts
3. Read CI config for enforcement checks
4. Assess tech stack for agent-friendliness
5. Generate JSON report
6. Provide top 3 actionable recommendations ranked by impact
