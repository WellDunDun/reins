# Critique: "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"

**Paper:** Gloaguen, Mündler, Müller, Raychev, Vechev (ETH Zurich / LogicStar)
**Published:** arXiv:2602.11988v1, 12 Feb 2026
**Reviewed by:** Daniel Petro (creator of Reins CLI, harness-engineering practitioner)

---

## TL;DR

The paper asks a good question — do AGENTS.md files actually help coding agents? — but its methodology is too narrow to answer it. It benchmarks context files on isolated bug-fix tasks, finds marginal impact, and concludes context files "are likely only desirable when manually written." That conclusion doesn't follow from the evidence because the evaluation never tests the scenarios where context files matter most: multi-step workflows, architecture decisions, and constraint enforcement.

---

## 1. What the Paper Claims

1. LLM-generated context files have a **marginal negative** effect on task success (decrease of 0.5% and 2% on SWE-BENCH LITE and AGENTBENCH respectively).
2. Developer-written context files provide only a **marginal performance gain**.
3. Context files consistently **increase the number of steps** and **increase cost** (by 20-25% on average).
4. Context files lead to **more testing and exploration** but don't improve resolution rates.
5. Context files are **redundant** — LLM-generated ones mostly duplicate documentation already available in the repo.
6. Therefore, context files should describe **only minimal requirements** and be **human-written**.

---

## 2. What the Paper Does Well

### 2.1. Rigorous Experimental Design
The five-stage construction pipeline for AGENTBENCH is well-structured: find repos, filter PRs, set up environments, generate task descriptions, generate unit tests. The use of a standardized task description format with a third-party LLM is a good control.

### 2.2. Multi-Model Coverage
Testing across Sonnet 4.5, GPT-5.2, GPT-5.1 Mini, and Qwen3-30B with multiple completions per instance gives reasonable breadth across model families.

### 2.3. Trace Analysis
Section 4.3 is the most valuable part of the paper. The tool-call categorization (build, quality, test, run_exec, search, file_ops, system) and frequency analysis by category is genuinely insightful. The finding that context files increase testing/exploration tokens without improving outcomes is worth investigating further.

### 2.4. Honest About Limitations
Section 5 acknowledges the Python-only scope, the limited task types, and the need for future work on code quality and security metrics. This is appreciated.

---

## 3. Methodological Problems

### 3.1. Benchmark Tasks Are the Wrong Evaluation Target

This is the central flaw. AGENTBENCH consists of **138 isolated bug-fix and feature-addition tasks** derived from pull requests. These are:

- Self-contained (single PR scope)
- Already described by PR descriptions and issue context
- Solvable by reading the immediate code neighborhood
- Validated by unit tests that check functional correctness only

Context files like AGENTS.md are not designed for this. They exist to communicate **cross-cutting concerns** that an agent wouldn't discover from a single PR: architectural constraints, module boundaries, testing conventions, deployment pipelines, merge discipline, dependency policies. The paper's own Table 1 shows the average codebase is ~3,337 files — but the tasks only touch tiny slices of those codebases.

**Analogy:** This is like evaluating a company's employee handbook by measuring whether new hires can fill out a single form faster with or without it. The handbook's value is in preventing systematic errors across hundreds of decisions, not in accelerating individual tasks.

### 3.2. LLM-Generated Context Files Are a Strawman

The paper pits three conditions: no context, LLM-generated context, human-written context. But the LLM-generated files are produced by asking models to *summarize the repository* — which produces exactly the kind of redundant overview the paper then criticizes. No serious AGENTS.md practitioner recommends "have GPT summarize your repo." The AGENTS.md spec and community guidance (Anthropic, 2025b; OpenAI, 2025c) explicitly recommend writing **constraints, rules, and workflow instructions** — not summaries.

Testing auto-generated summaries and concluding "context files don't help" is testing the wrong artifact.

### 3.3. The "Redundancy" Finding Is Circular

Section 4.2 finds that LLM-generated context files are redundant with existing repo documentation. Of course they are — they were *generated from* that documentation. This tells us nothing about whether a human-authored AGENTS.md containing information *not already in the repo* (constraints, anti-patterns, architectural decisions) would be redundant.

### 3.4. Cost Increase Is Expected and Not Inherently Bad

The paper treats increased steps and cost as a negative signal. But if context files cause agents to run more tests and explore more code (which the trace analysis confirms), that could be *exactly the desired behavior* — trading compute cost for reliability. The paper doesn't measure:

- Whether the agent's patches introduce fewer regressions
- Whether the patches follow repo conventions
- Whether the patches respect architectural boundaries
- Whether the agent avoids known anti-patterns

Only measuring pass/fail on unit tests misses the entire quality dimension.

### 3.5. Sample Size and Repo Selection Bias

AGENTBENCH has 138 instances from 12 repositories. All are Python. All are open-source. All have existing test suites. This is a specific niche:

- Excludes polyglot repositories where context files disambiguate tooling
- Excludes enterprise repos with complex CI/CD where constraints matter more
- Excludes repos with minimal documentation (where context files add the most value)
- The paper acknowledges "most repositories containing context files are niche" and "niche repositories have less strict rules regarding pull requests" — this selection bias undermines generalizability

### 3.6. No Evaluation of Constraint Adherence

Consider this repo's (Reins) AGENTS.md. It specifies:

- "Zero external runtime dependencies — stdlib only"
- "All commands output deterministic JSON"
- "Keep CLI command routing in `cli/reins/src/index.ts`; put reusable internals in `cli/reins/src/lib/`"
- "Resolve all PR conversations/comments before merge"

None of these are testable by unit test pass/fail. An agent could solve a bug perfectly while violating every one of these constraints. The paper's methodology would score that as a success. A real evaluation of AGENTS.md would measure whether agents *follow instructions*, not just whether they produce correct patches.

---

## 4. Statistical Concerns

### 4.1. Effect Sizes Are Within Noise

The reported differences (0.5% decrease for LLM, small gains for human) on 138-instance benchmarks with 4-6 completions per model are likely within confidence intervals. The paper doesn't report statistical significance tests, confidence intervals, or p-values. Given the sample sizes, it's plausible that all three conditions produce statistically indistinguishable results — which would mean the paper's conclusions are unsupported.

### 4.2. Aggregation Hides Per-Repo Variance

Figure 12 shows per-repository resolution rates. There's substantial variance — some repos show clear improvement with context files, others show degradation. Aggregating across repos with different characteristics (codebase size, documentation quality, task difficulty) obscures whether context files help *for specific types of repos*.

---

## 5. What's Missing from the Evaluation

| Dimension | Measured? | Why It Matters |
|-----------|-----------|----------------|
| Functional correctness | Yes (unit tests) | Baseline requirement |
| Code quality | No | Style, idioms, conventions |
| Constraint adherence | No | Following explicit rules |
| Architectural alignment | No | Respecting module boundaries |
| Dependency discipline | No | Not adding banned packages |
| Multi-step task performance | No | Real agent workflows |
| Regression prevention | No | Not breaking existing behavior |
| Agent self-correction | No | Following workflows, self-audit |
| Security posture | No | Not introducing vulnerabilities |
| Cost-adjusted quality | No | More steps producing better code |

The paper measures exactly one of these ten dimensions and draws broad conclusions about the utility of context files.

---

## 6. The Paper's Implicit Model of "Helpful" Is Too Narrow

The paper frames "helpful" as "increases resolution rate on benchmarks." But practitioners use AGENTS.md for:

1. **Steering behavior** — "always run tests before committing," "never modify the scoring logic in the skill layer"
2. **Preventing drift** — keeping agents aligned with architectural decisions across sessions
3. **Onboarding acceleration** — giving agents the same context a senior dev would provide in a code review
4. **Constraint enforcement** — making implicit rules explicit and machine-readable

None of these show up in a unit-test-only benchmark. The paper essentially evaluates whether a map helps you solve a math problem — the answer is "not really," but that says nothing about whether the map helps you navigate.

---

## 7. Positive Takeaways Worth Internalizing

Despite the above, several findings are useful for practitioners:

1. **Auto-generated repo summaries don't help.** Stop using them. Write constraints and rules instead. This validates what the AGENTS.md community already recommends.

2. **Context files increase exploration.** This is actually good for real work — you *want* agents reading more code and running more tests. The paper frames it negatively because their benchmark only rewards speed, not thoroughness.

3. **Prompt matching matters little.** Figure 9 shows that using CLAUDE CODE's prompt vs. CODEX's prompt makes negligible difference on SWE-BENCH LITE and AGENTBENCH. This suggests context files are model-agnostic, which is good for portability.

4. **Human-written files outperform LLM-generated ones.** Even in this narrow benchmark, the trend favors human authorship. With a proper evaluation measuring constraint adherence, the gap would likely widen.

5. **The trace analysis methodology is reusable.** Categorizing tool calls and comparing frequency distributions across conditions is a solid technique for understanding agent behavior changes.

---

## 8. Recommendations for the Authors

1. **Build a constraint-adherence benchmark.** Define repo-level rules (dependency restrictions, file placement, naming conventions, testing requirements) and measure whether agents follow them with and without context files.

2. **Test multi-step workflows.** Evaluate on tasks requiring multiple coordinated changes (refactors, feature additions touching multiple modules) where cross-cutting context matters.

3. **Separate content types.** Test "summary-style" context files vs. "constraint-style" context files vs. "workflow-style" context files independently. The paper lumps them all together.

4. **Report statistical significance.** Add confidence intervals, paired tests, and effect size measures. The current results may not be statistically meaningful.

5. **Expand beyond Python.** Test on polyglot repos, Rust/TypeScript/Go projects with stricter typing and build systems where convention adherence is more critical.

6. **Measure code review outcomes.** Instead of unit tests, have human reviewers evaluate patches on dimensions like convention adherence, readability, and architectural alignment — with and without context files.

---

## 9. Implications for the Reins Project

This paper inadvertently validates the Reins approach. Reins doesn't just dump a context file — it:

- **Audits** repos for harness-engineering readiness (scoring rubric)
- **Scaffolds** AGENTS.md with constraints derived from actual repo structure
- **Evolves** context files as repos change
- **Doctors** broken configurations

The paper shows that naive auto-generation (summarize the repo) doesn't work. Reins' model of structured, constraint-focused, auditable context files is exactly the alternative the paper's own results point toward but don't test.

---

## 10. Final Verdict

**Score: 5/10**

Good experimental infrastructure, wrong evaluation target. The paper answers "do context files help agents pass unit tests on isolated bug fixes?" (answer: barely) but markets itself as answering "are repository-level context files helpful for coding agents?" (much broader claim). The gap between the question asked and the question answered is too large for the conclusions to be actionable.

The paper should be titled: *"LLM-Generated Repository Summaries Do Not Improve Bug-Fix Resolution Rates on Python Benchmarks."* That's a defensible, narrower claim that the evidence supports.

---

*Reviewed 2026-02-25*
