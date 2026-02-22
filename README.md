# reins

The open-source toolkit for [Harness Engineering](https://openai.com/index/harness-engineering/) — OpenAI's methodology for building software where **humans steer and agents execute**.

OpenAI published the methodology. We built the tooling.

## What this does

**Score any repo** against harness engineering principles. **Scaffold** the full structure. **Evolve** to the next maturity level.

```
$ reins audit .

{
  "total_score": 6,
  "max_score": 18,
  "maturity_level": "L1: Assisted",
  "recommendations": [
    "Create ARCHITECTURE.md with domain map and layer rules",
    "Add linter configuration to enforce architectural constraints",
    "Create docs/golden-principles.md with mechanical taste rules"
  ]
}
```

## Quick start

```bash
# Install globally (requires Bun or Node)
npx reins audit .

# Or clone and link
git clone https://github.com/WellDunDun/reins.git
cd reins/cli/reins
bun install && bun link
```

Four commands:

```bash
reins init .           # Scaffold the full structure
reins audit .          # Score against harness principles (0-18)
reins evolve .         # Roadmap to next maturity level
reins doctor .         # Health check with prescriptive fixes
```

## The maturity model

Every repo sits on a maturity spectrum. The audit tells you where you are. The evolve workflow tells you what to do next.

```
Score   Level                What it means
─────   ─────                ──────────────
0-4     L0: Manual           Traditional engineering, no agent infra
5-8     L1: Assisted         Agents help, humans still write code
9-13    L2: Steered          Humans steer, agents execute most code
14-16   L3: Autonomous       Agents handle full lifecycle
17-18   L4: Self-Correcting  System maintains and improves itself
```

## What it scaffolds

Running `reins init .` creates:

```
AGENTS.md                        # Concise map (~100 lines) for agents
ARCHITECTURE.md                  # Domain map, layer rules, dependency direction
docs/
  golden-principles.md           # Mechanical taste rules enforced in CI
  design-docs/
    index.md                     # Design doc registry with verification status
    core-beliefs.md              # Agent-first operating principles
  product-specs/
    index.md                     # Product spec registry
  exec-plans/
    active/                      # Currently executing plans
    completed/                   # Historical plans with outcomes
    tech-debt-tracker.md         # Known debt with priority and ownership
  references/                    # External LLM-friendly reference docs
  generated/                     # Auto-generated docs (schema, API specs)
```

## The six audit dimensions

Each scored 0-3, totaling 0-18:

| Dimension | What it checks |
|-----------|---------------|
| **Repository Knowledge** | AGENTS.md, docs/, versioned execution plans |
| **Architecture Enforcement** | ARCHITECTURE.md, dependency rules, linters |
| **Agent Legibility** | Bootable app, observability, lean dependencies |
| **Golden Principles** | Documented taste rules, CI enforcement, cleanup process |
| **Agent Workflow** | Agent config, PR templates, merge gates |
| **Garbage Collection** | Debt tracking, doc-gardening, quality grades |

## Claude Code skill

This repo also includes a Claude Code skill for AI-native integration. The skill provides three workflows — Scaffold, Audit, and Evolve — that work inside Claude Code sessions.

To install the skill, copy `skill/Reins/` to `~/.claude/skills/Reins/`.

Then use natural language:
- "Scaffold a harness engineering project in this repo"
- "Audit this codebase against harness engineering principles"
- "Evolve this project to the next maturity level"

## Why open source

The Harness Engineering methodology was published by OpenAI in February 2026. It describes how they built a product with zero manually-written code — humans designed the environment and agents wrote everything.

The paper is compelling. But it shipped without tooling. No scaffolding, no audit framework, no maturity model implementation. Teams that wanted to adopt the methodology had to build their own infrastructure from scratch.

This project fills that gap. Open-sourcing it means:

- **Anyone can adopt agent-first development** without building tooling from zero
- **The audit framework becomes a shared standard** — teams can compare maturity levels using the same scoring rubric
- **The community can evolve the methodology** — the paper is a snapshot, but practices improve through iteration
- **Transparency builds trust** — teams making fundamental workflow changes need to understand and verify the tools they use

## Project structure

```
reins/
  cli/reins/            # The CLI tool (Bun + TypeScript, zero deps)
    src/index.ts        # Single-file CLI
    package.json
  skill/                # Claude Code skill
    Reins/
      SKILL.md          # Skill definition and routing
      HarnessMethodology.md  # Full methodology reference
      Workflows/
        Scaffold.md     # Scaffold workflow
        Audit.md        # Audit workflow
        Evolve.md       # Evolve workflow
```

## Requirements

- [Bun](https://bun.sh/) v1.0+ or Node.js 18+
- No other dependencies

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Methodology

Based on OpenAI's [Harness Engineering](https://openai.com/index/harness-engineering/) (February 2026, Ryan Lopopolo). The five pillars:

1. **Repository as system of record** — all knowledge versioned in-repo
2. **Layered domain architecture** — strict layer ordering with forward-only dependencies
3. **Agent legibility** — optimize for agent understanding, not just human readability
4. **Golden principles** — encode human taste mechanically, enforce in CI
5. **Garbage collection** — background agents clean drift continuously

## License

[MIT](LICENSE)
