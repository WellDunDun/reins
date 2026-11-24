# Instruction evaluation: grader validity correction, 10 November 2026

The frozen 48-endpoint Harbor schedule completed, but the earlier interpretation of 42 eligible outcomes/24 task failures is withdrawn. A post-hoc audit found grader/fixture defects affecting all 22Ithraa outcome labels. Raw scores and native artifacts remain unchanged; those 22scores are quarantined, not promoted to passes. No corrected full artifact regrade has been performed.

19 Ithraa runs failed a brochure selector that did not recognize the site's actual Arabic labels, “النشرة العربية” and “النشرة الإنجليزية”. They passed the English desktop checks before failing at Arabic controls. Three others used the native EmDash datetime field, but the fixture sent an offset ISO timestamp rejected by the pinned built-in validator; the same instant normalized to UTC is accepted. The task permitted UTC normalization. Reference-solution and prior qualification controls missed these valid alternatives.

Current accounting:48 attempts =20 retained OpenProse outcomes (18 passes,2 failures) +22 grader-quarantined Ithraa outcomes +6 infrastructure-missing. The latter are one connector-startup failure, four Claude quota terminations, and one trusted Chromium startup failure. There were no agent retries or replacement tasks.

| OpenProse agent | Historical | Flat | Routed | Guides removed |
|---|---:|---:|---:|---:|
| Claude |0/1; 2 missing|2/2; 1 missing|2/2; 1 missing|3/3|
| Codex |3/3|2/3|3/3|3/3|

Cells show passes/retained outcomes. All Ithraa raw zeros require corrected, versioned artifact regrading before a success/failure claim. They are not evidence that instruction variants equally failed a real task.

The surviving performance evidence is one task in one project, with three repetitions per condition/agent and missing historical Claude trials. It supports no cross-project performance claim, routed-superiority claim, universal length threshold, or empirically calibrated performance score for Reins. Routed did not outperform guides removed on OpenProse; it matched flat for Claude and had one additional Codex pass compared with flat. Those are local observations, not general effectiveness estimates. Selected recent 7/14-day cohorts remain empty.

The requested AGENTS.md → documentation router → ARCHITECTURE.md layout may remain a chosen navigation and maintenance policy. Reins can check links, scopes, executable commands, duplication and contradictions as structural properties. This study does not prove that enforcing this layout improves coding success. Research/engineering recommendations must remain separate from demonstrated performance gains.

The correct next validity step is to repair the Arabic-label and native-datetime contracts, validate those exact alternatives, and regrade preserved Ithraa artifacts without new agent solves. No corrected Ithraa pass rate is claimed. Detailed current evidence is retained locally in outputs/harbor-evaluation/bounded-study/REPORT.md, GRADER-AUDIT.json, ithraa-datetime-audit.json and evidence.csv. Original as-run reports and completion receipts are preserved under pre-grader-audit/; native jobs and raw rewards are unchanged. Model/config/task input assignments were not changed by this audit.

## Earlier one-project pilot, retained separately

The earlier 36-run pilot below is historical evidence from one project. Its observations are not pooled with the 48-endpoint Harbor study.

A local pilot compared historical repository guidance, a concise canonical contract with a documentation router, and AGENTS.md/CLAUDE.md files removed. Other documentation, source, and mandatory action boundaries remained available in every condition.

Three bounded regression tasks were derived from recent SelfTune traces: observed-label provenance without inferred negatives, embedded Markdown fences in JSON, and backward-compatible skill-bound content hashes. Discovery covered 14 completed days; all admitted turns were within the last seven days. The cases come from one project and one conversation and were chosen for reconstructability.

Each case ran with Codex gpt-6.1-sol and Claude Opus 5.5, three conditions, and two repeats: 36 scored runs. All 36 passed independent behavioral checks and their focused suites. There were no scored timeouts. The scorer failed the parent revisions and passed the historical fixes before model execution.

Paired geometric-mean changes for the router variant versus historical guidance:

| Agent | Input tokens, including cache | Wall time |
|-------|-------------------------------:|----------:|
| Codex | -12.6% | -4.9% |
| Claude | +53.5% | +16.7% |

These are context-processing totals, not billed-dollar savings. Resource effects were mixed, and no correctness gain was observed. The small passing task set cannot establish equivalence or justify blanket removal of instructions.

Runs used fresh tracked parent-commit trees and sessions, pinned model names, fixed within-agent tool access, a 300-second limit, and randomized order. Global customizations and memory were disabled. Native instruction autoload was disabled; the common prompt requested explicit local AGENTS.md discovery. Exact historical uncommitted state was not recovered. Preliminary runs with fixture or uncertified-isolation issues were excluded before analysis. Provider caches were not reset.

Keep the router as a maintainability convention, not a general performance claim. A larger evaluation needs independent projects, harder ownership/navigation tasks, task-cluster holdouts, and a flat concise treatment containing the same facts as the router treatment.

The frozen scorer, per-run patches, hashes, admission decisions, and detailed results are retained in the local evaluation artifacts. Private source trees and raw session history are not added to Reins.
