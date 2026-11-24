# Native instruction loading: development findings

9 November 2026. Development controls were rerun with Git-initialized fixtures after an initial non-Git setup was found inadequate. The Git rerun reproduced the `@./AGENTS.md` loading omission. These are scoped loading findings, not coding efficacy results or proof that routers improve outcomes.

## What was tested

The tests used Claude Code 2.1.316 with the official stock Harbor Claude agent in Docker Linux, starting in `/app/repo/src`, with root and nested instruction files, fresh trial configuration, and a simple Node edit request. The first images lacked `.git`. The rerun Dockerfiles initialize `/app/repo` and create one development-baseline commit after copying the fixture; they do not import future solution history. Codex session metadata independently records the Git commit and branch at both launch locations. The Claude Git-fixture qualification here is based on the inspected build recipe and completed rerun, not a separate live `git rev-parse` audit. The prompt asked only to fix and verify the function; it did not ask the agent to read instruction files. Harbor itself was pinned to commit `9c7a39b991d7e2205019f6be0598cbd22d84bfc3`.

Independent review examined native session `instructions` attachments, rather than relying only on final-response sentinels or task rewards. All four variants completed the functional control successfully, demonstrating why successful task grading alone cannot establish correct instruction loading.

| Adapter variant | Root guidance in native attachment | Nested guidance in native attachment | Functional control |
| --- | --- | --- | --- |
| `CLAUDE.md` contains `@./AGENTS.md` at both levels | Absent | Present as nested AGENTS.md | Passed |
| `CLAUDE.md` symlink to same-directory AGENTS.md | Present through root CLAUDE.md | Present through nested CLAUDE.md | Passed |
| Generated CLAUDE.md copy of same-directory AGENTS.md | Present through root CLAUDE.md | Present through nested CLAUDE.md | Passed |
| AGENTS.md only, no CLAUDE.md adapter | Present as root AGENTS.md | Present as nested AGENTS.md | Passed |

The table reports the Git-initialized rerun. An earlier non-Git control using plain `@AGENTS.md` omitted root guidance from a nested start, while its root-start control loaded root guidance. A separate Git control subsequently confirmed the same root omission for plain `@AGENTS.md`; the nested guidance loaded and the functional control passed.

The AGENTS.md files, router, architecture document and task prompt were byte-identical across the four variants. The generated copies matched their respective canonical AGENTS.md files exactly. The symlinks resolved to those same files. Root and nested guidance remained distinct scopes. Router targets were ordinary Markdown links; they were not eagerly imported into the adapter.

## Interpretation and limits

Official documentation says relative imports resolve from the containing file, while imports outside the working directory require approval. An ancestor import can therefore cross that boundary when starting inside a subdirectory. This is a plausible explanation for the observed omission; these controls did not prove the engine's internal cause. [Claude import documentation](https://code.claude.com/docs/en/memory#import-additional-files).

Claude's default AGENTS fallback is suppressed by project CLAUDE files. Current configuration uses `cc-plugin-agents-md@builtin`; older releases have different compatibility requirements. Native support and symlink/import alternatives are documented, including Windows symlink constraints. [Claude AGENTS documentation](https://code.claude.com/docs/en/memory#agentsmd), [official plugin implementation notes](https://github.com/anthropics/claude-code/blob/main/mods/agents-md/README.md).

Each adapter variant has one observed Git-fixture run, following the earlier non-Git runs. Codex 0.167.0 was also rerun in Git fixtures: its initial native instruction message contains root guidance at a root start, and both root and nested guidance at a nested start. That verifies initial delivery, without relying on later tool reads or final sentinels. The earlier non-Git Codex nested run delivered only nested guidance initially and later read root guidance through a tool, showing why the Git marker matters. Root-start transition controls are now observed: Claude used Bash to read `src/main.cjs` and delivered no nested guidance anywhere in the recorded session. Codex initially received root guidance, then discovered and explicitly read `src/AGENTS.md` through tools; its final nested sentinel therefore reflects discretionary file reading, not native nested autoload. These runs do not test a Claude dedicated Read-tool transition; that remains pending. Windows behavior, other CLI releases, other launch paths, additional directories, compaction and subagent loading have not been verified by these controls. The custom environment/provider capability implementation has not received a complete independent source review; these results do not certify network or verifier isolation. Those remain separate gates.

## Candidate adapter policy and remaining checks

The Git-fixture matrix supports these adapter candidates for the exact tested Linux launch configuration. The observed root-to-nested transitions do not establish automatic nested loading: Claude's Bash transition omitted nested guidance and Codex explicitly read the guide. Dedicated Read-tool and portability checks still gate a broader standard. Keep future task archives Git-realistic with a baseline-only commit, verify actual Git-root metadata, and never import future solution history.

The candidate design is to keep AGENTS.md canonical at each required scope, with a relative link to the document router. On platforms that preserve symlinks, evaluate a same-directory `CLAUDE.md -> AGENTS.md` adapter, subject to the remaining loading tests. Where symlinks are unsuitable, generate a byte-matched CLAUDE.md copy from the canonical file and enforce equality in tooling to prevent drift. Native AGENTS-only loading is another supported candidate when the CLI version, built-in availability and existing CLAUDE-file precedence are explicitly checked.

The dotted import omission persisted after Git-root initialization. Plain `@AGENTS.md` also omitted root guidance in its subsequent Git control. Do not recommend import shims as safe for arbitrary nested starts on the basis of a root-only test, and do not generalize this one dotted-import run to every agent version or launch configuration. Do not repair it by importing all router targets: that changes context loading and the routing treatment. Before scoring, freeze one tested adapter contract across matched F/R arms and document supported CLI versions, launch locations and platforms.

## Root-to-nested transition details

The Claude session `root-to-nested__DFdvGGV` has one root instruction attachment, then Bash source reads and edits; no nested marker or nested instruction attachment occurs. The Codex session `root-to-nested__NCLErsy` has root-only initial instructions, then an explicit `cat src/AGENTS.md` tool call before its final response. Both function controls passed. These are distinct delivery mechanisms and must not be combined into an "all native loading passed" claim.


Raw development logs and task manifests remain in the local evaluation workspace. No confirmatory correctness or resource comparison is reported here.

## Combined native budget observation

Eight additional offline source-image controls on Codex0.167.0 covered repository-root and nested marketing startup for historical, flat, router and maintained-guide-removal assignments. All exposed the same intended five tool leaves. Historical and flat nested startup each reached exactly32,768source bytes and omitted later nested-guide content. The router condition contained both complete tested critical/startup guides. No inference occurred. This is prompt construction evidence, not actual provider delivery or instruction efficacy.

The [official discovery documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance) describes one selected guide per ancestor directory and a combined32KiB default. Measure the full chain in UTF-8 bytes, verify the actual agent configuration and distinguish source availability from initial exposure. The first byte-prefix observer was corrected for repeated headings; the rerun changed neither source images nor native configuration. Earlier results and the measurement correction remain in the study record.

## Actual request construction in full source images

A later model-free check captured Claude Code 2.1.316 requests in memory at a local HTTP sink that returned400. No real provider inference or account credentials were used. Four OpenProse layouts delivered their expected maintained guides, or none for the removal condition, with the intended model, medium effort and five tool declarations. Eight Ithraa root/nested measurements used the same native profile.

In Ithraa, root historical/flat and nested flat startup delivered all operating excerpt units. Raw full-file comparisons differed because Claude removed HTML verification comments. Historical nested startup delivered only the parent CLAUDE critical-rules excerpt; neither expected AGENTS body appeared. The routed nested layout delivered both full guides and all six critical excerpts. These are literal source sections, not independent tasks, and do not establish task-solving gains or the internal cause of an import omission.

Configuration must preserve the feature being measured. An empty settings-source list removed project instructions; use a project source when testing native guidance and control hooks and MCP separately. An initialization record with five tools did not imply five model-facing declarations: earlier requests also contained a deferred placeholder. The documented ENABLE_TOOL_SEARCH=false setting removed it in the observed construction profile. [Instruction sources](https://code.claude.com/docs/en/agent-sdk/claude-code-features), [tool search](https://code.claude.com/docs/en/mcp#tool-search-through-an-llm-gateway).

Report source availability, native exposure and task outcomes separately. Preserve comment-stripped metadata mismatches instead of calling them lost operating rules. Treat missing historical exposure as a loader observation requiring configuration review, never as a coding failure. Exact startup controls do not certify real-provider authentication, all directory transitions, arbitrary-candidate isolation or instruction efficacy. The cross-project study still has zero frozen/admitted confirmatory tasks and zero scored trials.
