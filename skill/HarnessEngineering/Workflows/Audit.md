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
| AGENTS.md exists and is under 150 lines | +1 |
| docs/ directory with indexed design docs | +1 |
| Execution plans versioned in-repo (not external tools) | +1 |

### 2. Architecture Enforcement (0-3)

| Check | Points |
|-------|--------|
| ARCHITECTURE.md defines domains and layers | +1 |
| Dependency direction rules documented | +1 |
| Mechanical enforcement (linters/structural tests) | +1 |

### 3. Agent Legibility (0-3)

| Check | Points |
|-------|--------|
| App bootable per worktree/branch | +1 |
| Observability accessible to agents (logs, metrics) | +1 |
| Boring tech stack, minimal opaque dependencies | +1 |

### 4. Golden Principles (0-3)

| Check | Points |
|-------|--------|
| Documented mechanical taste rules | +1 |
| Rules enforced in CI (not just documented) | +1 |
| Recurring cleanup/refactoring process | +1 |

### 5. Agent Workflow (0-3)

| Check | Points |
|-------|--------|
| Agent can open PRs from prompts | +1 |
| Agent-to-agent review capability | +1 |
| Minimal blocking merge gates | +1 |

### 6. Garbage Collection (0-3)

| Check | Points |
|-------|--------|
| Tech debt tracked in-repo | +1 |
| Automated doc-gardening process | +1 |
| Quality grades per domain/layer | +1 |

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
