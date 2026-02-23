# Reins Scaffold Workflow

Set up a new or existing repository with the full harness engineering structure.

## Default Command

Use Reins before manual scaffolding:
- Local source: `cd cli/reins && bun src/index.ts init <path>`
- Package mode: `npx reins-cli init <path>`

Only fall back to manual file-by-file scaffolding if the command cannot run.

## Steps

### 1. Assess Current State

Read the target directory to understand what exists:
- Is there an existing AGENTS.md?
- Is there a docs/ directory?
- What's the tech stack? (package.json, Cargo.toml, go.mod, etc.)
- Is there CI already configured?

### 2. Generate AGENTS.md

Create a concise (~100 line) AGENTS.md that serves as a map:

```markdown
# AGENTS.md

## Repository Overview
[1-2 sentence description of the project]

## Architecture
See ARCHITECTURE.md for domain map and dependency rules.

## Documentation Map
| Topic | Location | Status |
|-------|----------|--------|
| Architecture | ARCHITECTURE.md | Current |
| Design Docs | docs/design-docs/index.md | Current |
| Product Specs | docs/product-specs/index.md | Current |
| Execution Plans | docs/exec-plans/active/ | Current |
| Technical Debt | docs/exec-plans/tech-debt-tracker.md | Current |
| References | docs/references/ | Current |

## Development Workflow
1. Receive task via prompt
2. Read relevant docs from the map above
3. Implement changes following ARCHITECTURE.md layer rules
4. Run linters and structural tests
5. Self-review, then request agent review
6. Iterate until all reviewers satisfied
7. Open PR with summary

## Golden Principles
See docs/golden-principles.md for mechanical taste rules.

## Key Constraints
- Dependencies flow forward only: Types > Config > Repo > Service > Runtime > UI
- Cross-cutting concerns enter ONLY through Providers
- Validate data at boundaries, never probe shapes
- Prefer shared utilities over hand-rolled helpers
```

### 3. Generate Directory Structure

Create the full docs/ layout:

```
docs/
  design-docs/
    index.md          # Design doc registry with verification status
    core-beliefs.md   # Agent-first operating principles
  exec-plans/
    active/           # Currently executing plans
    completed/        # Historical plans with outcomes
    tech-debt-tracker.md  # Known debt with priority
  generated/          # Auto-generated docs (schema, API specs)
  product-specs/
    index.md          # Product spec registry
  references/         # External LLM-friendly reference docs
  golden-principles.md  # Mechanical taste rules
```

Create `risk-policy.json` at repository root with risk tiers, watch paths, and docs drift rules.

### 4. Generate ARCHITECTURE.md

Create domain map with layer rules. Customize to the project's actual domains:

- Identify business domains from existing code
- Define the layer stack per domain
- Document dependency rules
- Include enforcement instructions

### 5. Generate Golden Principles

Create `docs/golden-principles.md` with starter rules:

- Shared utilities over hand-rolled helpers
- Validate at boundaries, typed SDKs preferred
- Structural consistency enforced mechanically
- Formatting rules beyond standard linters
- Naming conventions for the project

### 6. Generate Structural Linter Config

If the project uses TypeScript/JavaScript:
- Create eslint rules for dependency direction
- Add import restrictions per layer

If the project uses another language:
- Create equivalent linter config for that ecosystem

### 7. Set Up Garbage Collection

Create a recurring cleanup task template:
- Doc-gardening agent instructions
- Quality grade tracking template
- Refactoring PR workflow

### 8. Verify

Confirm all files created. Run any linters. Take screenshot if UI involved.
