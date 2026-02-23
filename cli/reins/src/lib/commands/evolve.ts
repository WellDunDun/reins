import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  type AutomationPack,
  hasAgentFactoryPack,
  recommendAutomationPack,
  scaffoldAutomationPack,
} from "../automation-pack";
import type { AuditResult, EvolutionPath, EvolutionStep, InitOptions } from "../types";

type LevelKey = "L0" | "L1" | "L2" | "L3" | "L4";
type EvolvePathKey = Exclude<LevelKey, "L4">;

interface EvolvePackState {
  packRecommendation: ReturnType<typeof recommendAutomationPack>;
  hasFactoryPack: boolean;
  shouldRecommendFactoryPack: boolean;
}

interface EvolveDeps {
  runAudit: (targetPath: string) => AuditResult;
  runInit: (options: InitOptions) => void;
}

const EVOLUTION_PATHS: Record<EvolvePathKey, EvolutionPath> = {
  L0: {
    from: "L0: Manual",
    to: "L1: Assisted",
    goal: "Get agents into the development loop",
    steps: [
      {
        step: 1,
        action: "Create AGENTS.md",
        description: "Concise map (~100 lines) pointing agents to deeper docs. Run 'reins init .' to generate.",
        automated: true,
      },
      {
        step: 2,
        action: "Create docs/ structure",
        description: "Design docs, product specs, references, execution plans — all versioned in-repo.",
        automated: true,
      },
      {
        step: 3,
        action: "Document architecture",
        description: "ARCHITECTURE.md with domain map, layer ordering, and dependency direction rules.",
        automated: true,
      },
      {
        step: 4,
        action: "Set up agent-friendly CI",
        description: "Fast feedback, clear error messages, deterministic output. Agents need to parse CI results.",
        automated: false,
      },
      {
        step: 5,
        action: "First agent PR",
        description: "Have an agent open its first PR from a prompt. Validates the full loop works end-to-end.",
        automated: false,
      },
    ],
    success_criteria: "Agent can read AGENTS.md, follow pointers, and open a useful PR.",
  },
  L1: {
    from: "L1: Assisted",
    to: "L2: Steered",
    goal: "Shift from human-writes-code to human-steers-agent",
    steps: [
      {
        step: 1,
        action: "Write golden principles",
        description: "Mechanical taste rules in docs/golden-principles.md, enforced in CI — not just documented.",
        automated: true,
      },
      {
        step: 2,
        action: "Add structural linters",
        description: "Custom lint rules for dependency direction, layer violations, naming conventions.",
        automated: false,
      },
      {
        step: 3,
        action: "Enable worktree isolation",
        description: "App bootable per git worktree — one instance per in-flight change.",
        automated: false,
      },
      {
        step: 4,
        action: "Create exec-plan templates",
        description: "Versioned execution plans in docs/exec-plans/ — active, completed, and tech debt tracked.",
        automated: true,
      },
      {
        step: 5,
        action: "Adopt prompt-first workflow",
        description: "Describe tasks in natural language. Agents write all code, tests, and docs.",
        automated: false,
      },
    ],
    success_criteria: "Most new code is written by agents, not humans.",
  },
  L2: {
    from: "L2: Steered",
    to: "L3: Autonomous",
    goal: "Agent handles full PR lifecycle end-to-end",
    steps: [
      {
        step: 1,
        action: "Establish risk tiers and policy-as-code",
        description: "Create risk-policy.json defining risk tiers, docs-drift rules, and watch paths for enforcement.",
        automated: false,
      },
      {
        step: 2,
        action: "Enforce golden principles mechanically",
        description:
          "Add structural lint scripts and CI gates that enforce golden principles — not just document them.",
        automated: false,
      },
      {
        step: 3,
        action: "Enable self-validation",
        description: "Agent drives the app, takes screenshots, checks behavior against expectations.",
        automated: false,
      },
      {
        step: 4,
        action: "Add doc-gardening automation",
        description: "Add verification headers (<!-- Verified: -->), freshness scripts, and recurring doc review.",
        automated: false,
      },
      {
        step: 5,
        action: "Build escalation paths",
        description: "Clear criteria for when to involve humans vs. when agents can proceed autonomously.",
        automated: false,
      },
    ],
    success_criteria: "Agent can end-to-end ship a feature from prompt to merge.",
  },
  L3: {
    from: "L3: Autonomous",
    to: "L4: Self-Correcting",
    goal: "System maintains and improves itself without human intervention",
    steps: [
      {
        step: 1,
        action: "Implement active doc-gardening with drift detection",
        description: "Automated drift detection between docs and code, with auto-repair capabilities.",
        automated: false,
      },
      {
        step: 2,
        action: "Add quality grades",
        description: "Per-domain, per-layer scoring tracked in ARCHITECTURE.md.",
        automated: false,
      },
      {
        step: 3,
        action: "Automate enforcement ratio tracking",
        description: "Track >80% of golden principles enforced in CI — measure and improve coverage.",
        automated: false,
      },
      {
        step: 4,
        action: "Track tech debt continuously",
        description: "In-repo tracker with recurring review — debt paid down in small increments.",
        automated: true,
      },
      {
        step: 5,
        action: "Establish docs-drift rules",
        description: "Link code changes to required doc updates via risk-policy.json watchPaths and docsDriftRules.",
        automated: false,
      },
    ],
    success_criteria: "Codebase improves in quality without human intervention.",
  },
};

function resolveCurrentLevelKey(totalScore: number): LevelKey {
  if (totalScore <= 4) return "L0";
  if (totalScore <= 8) return "L1";
  if (totalScore <= 13) return "L2";
  if (totalScore <= 16) return "L3";
  return "L4";
}

function isFactoryPackRecommended(
  currentKey: LevelKey,
  selectedPack: ReturnType<typeof recommendAutomationPack>["selected"],
  hasFactoryPack: boolean,
): boolean {
  if (selectedPack !== "agent-factory" || hasFactoryPack) return false;
  return currentKey === "L0" || currentKey === "L1" || currentKey === "L2";
}

function buildPackState(targetDir: string, currentKey: LevelKey): EvolvePackState {
  const packRecommendation = recommendAutomationPack(targetDir);
  const hasFactoryPack = hasAgentFactoryPack(targetDir);
  const shouldRecommendFactoryPack = isFactoryPackRecommended(currentKey, packRecommendation.selected, hasFactoryPack);
  return { packRecommendation, hasFactoryPack, shouldRecommendFactoryPack };
}

function buildEvolutionSteps(path: EvolutionPath, shouldRecommendFactoryPack: boolean): EvolutionStep[] {
  const steps = [...path.steps];
  if (!shouldRecommendFactoryPack) return steps;

  steps.push({
    step: steps.length + 1,
    action: "Adopt agent-factory automation pack",
    description:
      "Scaffold structural lint, docs freshness, and PR review automation with 'reins init . --pack agent-factory'.",
    automated: true,
  });
  return steps;
}

function hasMissingBaseScaffold(targetDir: string): boolean {
  const requiredArtifacts = [
    "AGENTS.md",
    "ARCHITECTURE.md",
    "risk-policy.json",
    "docs/golden-principles.md",
    "docs/design-docs/index.md",
    "docs/design-docs/core-beliefs.md",
    "docs/product-specs/index.md",
    "docs/exec-plans/tech-debt-tracker.md",
    "docs/exec-plans/active",
    "docs/exec-plans/completed",
    "docs/generated",
    "docs/references",
  ];

  return requiredArtifacts.some((artifact) => !existsSync(join(targetDir, artifact)));
}

function applyEvolveScaffolding(
  targetDir: string,
  targetPath: string,
  runApply: boolean,
  shouldRecommendFactoryPack: boolean,
  path: EvolutionPath,
  runInit: EvolveDeps["runInit"],
): string[] {
  const applied: string[] = [];
  if (!runApply) return applied;

  const needsInitScaffold = path.steps.some(
    (step) => step.automated && (step.action.includes("AGENTS.md") || step.action.includes("docs/")),
  );
  const missingBaseScaffold = hasMissingBaseScaffold(targetDir);
  if (needsInitScaffold && missingBaseScaffold) {
    const initPack: AutomationPack = shouldRecommendFactoryPack ? "agent-factory" : "none";
    runInit({ path: targetPath, name: "", force: false, pack: initPack, allowExistingAgents: true });
    applied.push(
      initPack === "agent-factory"
        ? "Ran 'reins init' with agent-factory pack to scaffold missing structure and automation"
        : "Ran 'reins init' to scaffold missing structure",
    );
    return applied;
  }

  if (!shouldRecommendFactoryPack) return applied;

  const packArtifacts = scaffoldAutomationPack(targetDir, "agent-factory", false);
  if (packArtifacts.length > 0) {
    applied.push(`Applied 'agent-factory' automation pack scaffolding (${packArtifacts.length} artifact(s))`);
  }

  return applied;
}

function buildWeakestDimensions(
  result: AuditResult,
): Array<{ dimension: string; score: number; max: number; findings: string[] }> {
  return Object.entries(result.scores)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3)
    .map(([dimension, score]) => ({ dimension, score: score.score, max: score.max, findings: score.findings }));
}

function buildPackRecommendationOutput(packState: EvolvePackState): { recommended: string | null; reason: string } {
  if (packState.shouldRecommendFactoryPack) {
    return {
      recommended: "agent-factory",
      reason: packState.packRecommendation.reason,
    };
  }

  if (packState.hasFactoryPack) {
    return {
      recommended: null,
      reason: "Agent-factory automation pack already present.",
    };
  }

  if (packState.packRecommendation.selected === "agent-factory") {
    return {
      recommended: null,
      reason: "Agent-factory recommendation suppressed by maturity level.",
    };
  }

  return {
    recommended: null,
    reason: packState.packRecommendation.reason,
  };
}

function printL4Response(auditResult: AuditResult): void {
  console.log(
    JSON.stringify(
      {
        command: "evolve",
        project: auditResult.project,
        current_level: auditResult.maturity_level,
        current_score: auditResult.total_score,
        message: "Already at L4: Self-Correcting. Focus on maintaining quality grades and continuous improvement.",
        pack_recommendation: {
          recommended: null,
          reason: "Already at L4. Keep existing automation healthy and continuously verified.",
        },
      },
      null,
      2,
    ),
  );
}

function getAuditResultOrExit(targetPath: string, runAudit: EvolveDeps["runAudit"]): AuditResult {
  try {
    return runAudit(targetPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}

export function runEvolve(targetPath: string, runApply: boolean, deps: EvolveDeps): void {
  const auditResult = getAuditResultOrExit(targetPath, deps.runAudit);
  const currentKey = resolveCurrentLevelKey(auditResult.total_score);
  if (currentKey === "L4") {
    printL4Response(auditResult);
    return;
  }

  const targetDir = resolve(targetPath);
  const path = EVOLUTION_PATHS[currentKey];
  const packState = buildPackState(targetDir, currentKey);
  const steps = buildEvolutionSteps(path, packState.shouldRecommendFactoryPack);
  const applied = applyEvolveScaffolding(
    targetDir,
    targetPath,
    runApply,
    packState.shouldRecommendFactoryPack,
    path,
    deps.runInit,
  );

  console.log(
    JSON.stringify(
      {
        command: "evolve",
        project: auditResult.project,
        current_level: auditResult.maturity_level,
        current_score: auditResult.total_score,
        next_level: path.to,
        goal: path.goal,
        steps,
        success_criteria: path.success_criteria,
        weakest_dimensions: buildWeakestDimensions(auditResult),
        pack_recommendation: buildPackRecommendationOutput(packState),
        applied,
        recommendations: auditResult.recommendations,
      },
      null,
      2,
    ),
  );
}
