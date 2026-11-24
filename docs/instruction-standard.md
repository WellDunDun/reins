# Repository instruction standard

This is Reins policy, informed by the research review. The exact router filename and word budget are design choices, not experimentally established optima.

## Canonical guidance

Maintain shared project instructions in AGENTS.md. Prefer a same-directory CLAUDE.md symlink where checkout support is verified, or a generated matching copy with an equality check. Version-gated native AGENTS loading is another option when its precedence is tested. Existing agent-specific additions require review before consolidation.

Verify exact agent versions, Git project roots, startup working directories and transitions into nested directories. In the local Claude Code 2.1.316 controls, ancestor `@AGENTS.md` and `@./AGENTS.md` imports omitted root guidance on a nested start. Symlinks, matching copies and native AGENTS loading delivered both startup scopes. A root-to-nested Bash transition did not automatically deliver the nested Claude guidance. These loader observations are not a coding-performance evaluation or a Windows portability result. A Markdown link is discretionary navigation, and a resolving import is not proof of native delivery.

Every maintained AGENTS.md, including nested files, must contain a relative Markdown link to a repository-local documentation router. Default to `[Documentation router](docs/ROUTER.md)` at root, and adjust the relative path in nested files. An existing index can serve as the router if linked with the label `Documentation router`.

The router must link to an existing ARCHITECTURE.md. Architecture can live outside the root. Router destinations must be existing local files or explicitly external references. Each route explains when to read its target. Do not require reading the entire documentation tree for every task.

```text
AGENTS.md -> docs/ROUTER.md -> ARCHITECTURE.md
                         -> relevant design decisions
                         -> relevant verification or release runbooks
packages/example/AGENTS.md -> ../../docs/ROUTER.md
CLAUDE.md -> AGENTS.md
```

## Keep in AGENTS.md

- A short statement of project purpose when needed for orientation.
- Verified setup and focused verification commands, with their working directories.
- Non-obvious domain invariants, ownership boundaries, generated-source rules, and change-propagation requirements.
- Applicable privacy, spending, deployment, publishing, and data-deletion boundaries.
- The documentation-router link and necessary scoped-guidance pointers.

Nested files add rules for their directory. Do not copy the root contract into each package. Root guidance must tell agents to inspect the instruction chain relevant to touched paths and follow its router. Loading and precedence vary between agents; final compliance alone does not prove autoload.

## Route elsewhere

| Material | Canonical destination |
|----------|-----------------------|
| Component relationships and dependency boundaries | ARCHITECTURE.md |
| Decision rationale and explicit migrations | An ADR or design record |
| Build, test, release, incident, and provider procedures | Focused runbooks |
| Reusable specialized procedures | A skill |
| Feature inventory and brand copy | Product or content documentation |
| Experiment progress, hashes, current run IDs, and milestones | Evidence manifests and execution records |
| Formatting, naming, and import sorting | Linter or formatter configuration |

Retain a short warning in AGENTS.md when missing the routed rule could cause harm. Moving a procedure must not remove its authorization boundary.

## Remove or repair

Remove placeholder identities, imaginary commands, copied dependency versions, unsupported claims of deployment or enforcement, unconditional orchestration requirements, obsolete migration constraints, and duplicated rules. Do not infer that a document is current from its existence, timestamp, or a generated `CURRENT` label.

For descriptive claims such as paths, commands, versions, and established coding conventions, verify against owning source and tests. Report discrepancies and repair stale prose within scope. Do not rewrite working code just to match stale descriptive guidance. Explicit user requirements, deliberate target-state migrations, privacy boundaries, and authorization rules remain binding; existing code is not proof that it meets them.

## Router entries

Use a table with a task trigger and a relative link. Add ownership or review evidence only when maintained. Mark scaffolded descriptions as draft. Track important verification with the owning commit, test output, or evidence record rather than asserting every row is current.

The required minimum is architecture routing. Add testing, product, security, release, and design routes only when those documents exist and are useful. Small projects need not manufacture a large documentation tree.

## Reins checks

`audit` exposes additive `instruction_checks`. `doctor` includes the same checks in its summary. Both inspect files without executing project commands.

Failures cover missing root guidance, missing or broken router links in any scanned AGENTS.md, missing architecture routes, invalid local router targets, and broken or escaping instruction adapters. Warnings cover guidance over 1,000 words, independently maintained CLAUDE.md rules, imports needing runtime validation, and discretionary Markdown delegation. A matching copy passes the content-synchronization check, not a runtime-loading test. Length is a review trigger, not an automatic deletion rule.

The scanner skips dependency/build trees, `.agents` skill bundles, `.context`, `.repos`, `.factory`, and Claude worktrees. It does not traverse directory symlinks. It supports inline and full/collapsed reference Markdown links, and standalone Claude imports. Use file links in routers. It does not validate URL availability, Markdown anchors, command behavior, instruction precedence, semantic contradictions, or actual agent loading. Heuristic warnings require review. Existing maturity scoring is retained and is not a correctness certificate.

`init` adds docs/ROUTER.md and routes new guidance through it. Existing AGENTS.md is preserved unless `--force` is requested. A project with existing guidance needs an explicit merge; init must not silently rewrite its contract.

## Adoption

1. Choose the maintained checkout and branch before editing. Compare worktree variants without declaring the newest file authoritative.
2. Preserve operational boundaries and identify canonical documentation.
3. Create or reuse the router and real architecture document.
4. Add links to root and nested AGENTS.md files, then consolidate adapters.
5. Extract duplicate or task-specific material in reviewable changes.
6. Run doctor, owning project checks, and a fresh-agent navigation smoke test.
7. Compare representative task success, wrong-file edits, wall time, tokens, and external-action violations before expanding the policy.

The mandatory router is a maintainability policy requested for this portfolio. Its performance impact remains to be measured. Do not claim the literature proves this exact layout.

## Native context budgets

Budget UTF-8 bytes across the whole ancestor instruction chain as well as words per file. Codex currently documents a combined32KiB default controlled by `project_doc_max_bytes`; overrides, fallbacks, global instructions and working-directory discovery require an actual runtime check. A long root file can leave little room for a nested guide. Wide Markdown table padding can consume substantial bytes without adding words. Move detail behind the router and keep critical scoped rules early. Reins currently reports a word-count review warning; it does not certify native byte-budget fit.

In pinned offline Codex0.167.0 controls, two full monorepo layouts exhausted the same32,768byte source budget at nested startup. A smaller router layout delivered both tested critical guides. These controls establish instruction exposure only, with zero model calls; they do not establish task-performance improvement. See [official discovery rules](https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance).


Native configuration can disable guidance accidentally. Preserve project instruction loading when isolating hooks or MCP, and verify request content rather than initialization summaries alone. Exact text comparisons can also differ because a loader strips HTML verification comments; distinguish that from missing operating instructions. See the [full-source request-construction findings](research/native-instruction-loading.md#actual-request-construction-in-full-source-images). These checks establish exposure, not an efficacy optimum.
