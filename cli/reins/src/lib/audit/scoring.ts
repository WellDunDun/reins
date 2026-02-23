import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectCliDiagnosabilitySignals } from "../detection";
import { findFiles, safeReadDir } from "../filesystem";
import { countGoldenPrinciples } from "../scoring-utils";
import type { AuditResult } from "../types";
import type { AuditRuntimeContext } from "./context";

function scoreRepositoryAgents(result: AuditResult, ctx: AuditRuntimeContext): void {
  const agentsMdPath = join(ctx.targetDir, "AGENTS.md");
  if (existsSync(agentsMdPath)) {
    const lines = readFileSync(agentsMdPath, "utf-8").split("\n").length;
    if (lines <= 150) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push(`AGENTS.md exists (${lines} lines)`);
    } else {
      result.scores.repository_knowledge.findings.push(`AGENTS.md exists but too long (${lines} lines, target: <150)`);
    }
  } else {
    result.scores.repository_knowledge.findings.push("AGENTS.md missing");
    result.recommendations.push("Create AGENTS.md as a concise map (~100 lines) — run 'reins init .'");
  }

  const allAgentsMd = findFiles(ctx.targetDir, /^AGENTS\.md$/);
  if (allAgentsMd.length >= 2) {
    result.scores.repository_knowledge.findings.push(`Hierarchical AGENTS.md detected (${allAgentsMd.length} files)`);
  }
}

function scoreRepositoryDocs(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (ctx.verifiedDocs.length > 0) {
    result.scores.repository_knowledge.findings.push(`Verification headers found in ${ctx.verifiedDocs.length} doc(s)`);
  }

  if (existsSync(ctx.docsDir)) {
    const hasDesignDocs = existsSync(join(ctx.docsDir, "design-docs"));
    const hasIndex = existsSync(join(ctx.docsDir, "design-docs", "index.md"));
    if (hasDesignDocs && hasIndex) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push("docs/design-docs/ with index exists");

      const indexContent = readFileSync(join(ctx.docsDir, "design-docs", "index.md"), "utf-8");
      const tableRows = indexContent.split("\n").filter((line) => line.includes("|")).length;
      const dataRows = Math.max(0, tableRows - 2);
      if (dataRows >= 3) {
        result.scores.repository_knowledge.findings.push(`${dataRows} design decisions documented`);
      }
    } else if (hasDesignDocs) {
      result.scores.repository_knowledge.findings.push("docs/design-docs/ exists but missing index.md");
    } else {
      result.scores.repository_knowledge.findings.push("docs/design-docs/ missing");
    }
  } else {
    result.scores.repository_knowledge.findings.push("docs/ directory missing");
    result.recommendations.push("Create docs/ directory structure — run 'reins init .'");
  }
}

function scoreRepositoryExecutionPlans(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (existsSync(ctx.execPlansDir)) {
    const hasActive = existsSync(join(ctx.execPlansDir, "active"));
    const hasCompleted = existsSync(join(ctx.execPlansDir, "completed"));
    if (hasActive && hasCompleted) {
      result.scores.repository_knowledge.score++;
      result.scores.repository_knowledge.findings.push("Execution plans versioned in-repo");
    } else {
      result.scores.repository_knowledge.findings.push("exec-plans/ incomplete (missing active/ or completed/)");
    }
  } else {
    result.scores.repository_knowledge.findings.push("No versioned execution plans");
  }
}

function scoreRepositoryKnowledge(result: AuditResult, ctx: AuditRuntimeContext): void {
  scoreRepositoryAgents(result, ctx);
  scoreRepositoryDocs(result, ctx);
  scoreRepositoryExecutionPlans(result, ctx);
}

function hasDeepLinterEnforcement(ctx: AuditRuntimeContext): boolean {
  if (ctx.hasStructuralLintScript) return true;

  const linterConfigs = [".eslintrc.json", ".eslintrc.js", "eslint.config.js", "eslint.config.mjs", "biome.json"];
  for (const cfg of linterConfigs) {
    const cfgPath = join(ctx.targetDir, cfg);
    if (!existsSync(cfgPath)) continue;

    try {
      const cfgContent = readFileSync(cfgPath, "utf-8");
      if (/no-restricted-imports|import\/no-default-export|boundaries|dependency/i.test(cfgContent)) {
        return true;
      }

      if (cfg === "biome.json") {
        const rulesMatch = cfgContent.match(
          /"(recommended|all|suspicious|correctness|style|complexity|nursery|performance|security|a11y)"/g,
        );
        if (rulesMatch && rulesMatch.length >= 5) return true;
      }
    } catch {
      // ignore broken linter config
    }
  }

  return false;
}

function scoreArchitectureEnforcement(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (existsSync(ctx.archMdPath)) {
    const archContent = readFileSync(ctx.archMdPath, "utf-8");
    if (/dependenc|layer|forward only|import/i.test(archContent)) {
      result.scores.architecture_enforcement.score++;
      result.scores.architecture_enforcement.findings.push("ARCHITECTURE.md with dependency direction rules");
    } else {
      result.scores.architecture_enforcement.findings.push(
        "ARCHITECTURE.md exists but lacks dependency direction rules",
      );
      result.recommendations.push("Document dependency direction rules in ARCHITECTURE.md");
    }
  } else {
    result.scores.architecture_enforcement.findings.push("ARCHITECTURE.md missing");
    result.recommendations.push("Create ARCHITECTURE.md with domain map and layer rules");
  }

  if (ctx.hasEslint || ctx.hasBiome) {
    result.scores.architecture_enforcement.score++;
    if (hasDeepLinterEnforcement(ctx)) {
      result.scores.architecture_enforcement.findings.push("Linter configuration found with architectural enforcement");
    } else {
      result.scores.architecture_enforcement.findings.push("Linter configuration found");
    }
  } else {
    result.scores.architecture_enforcement.findings.push("No linter configuration found");
    result.recommendations.push("Add linter configuration to enforce architectural constraints");
  }

  const ciRefsEnforcement = ctx.ciEnforcementSteps.some((step) =>
    ["lint", "test", "typecheck", "type-check"].includes(step),
  );
  const goldenEnforcementRatio =
    existsSync(ctx.goldenPath) &&
    /lint|eslint|biome|enforced/i.test(readFileSync(ctx.goldenPath, "utf-8")) &&
    (ctx.hasEslint || ctx.hasBiome);
  const enforcementSignals = [
    ctx.hasRiskPolicy,
    ciRefsEnforcement,
    ctx.hasStructuralLintScript,
    goldenEnforcementRatio,
  ].filter(Boolean).length;

  if (enforcementSignals >= 2) {
    result.scores.architecture_enforcement.score++;
    result.scores.architecture_enforcement.findings.push(
      `Enforcement evidence detected (${enforcementSignals} signals)`,
    );
  } else if (enforcementSignals === 1) {
    result.scores.architecture_enforcement.findings.push("Partial enforcement evidence (need 2+ signals)");
  }
}

function hasBootableWorkspace(ctx: AuditRuntimeContext): boolean {
  for (const workspace of ctx.monorepoWorkspaces) {
    const workspaceDir = join(ctx.targetDir, workspace.replace(/\*/g, ""));
    if (!existsSync(workspaceDir)) continue;

    for (const entry of safeReadDir(workspaceDir)) {
      const workspacePkgPath = join(workspaceDir, entry, "package.json");
      if (!existsSync(workspacePkgPath)) continue;

      try {
        const workspacePkg = JSON.parse(readFileSync(workspacePkgPath, "utf-8"));
        if (workspacePkg.scripts?.dev || workspacePkg.scripts?.start) return true;
      } catch {
        // ignore parse failures
      }
    }
  }

  return false;
}

function scoreObservability(result: AuditResult, ctx: AuditRuntimeContext): void {
  const obsFiles = ["docker-compose.yml", "docker-compose.yaml", "grafana", "prometheus.yml"];
  const hasTraditionalObs = obsFiles.some(
    (file) => existsSync(join(ctx.targetDir, file)) || existsSync(join(ctx.targetDir, "infra", file)),
  );

  const sentryFiles = findFiles(ctx.targetDir, /^sentry\.(client|server)\.config\./i, 1);
  const hasVercelJson = existsSync(join(ctx.targetDir, "vercel.json"));
  const hasNetlifyToml = existsSync(join(ctx.targetDir, "netlify.toml"));
  let hasSentryDep = false;
  let hasDatadogDep = false;
  if (existsSync(ctx.pkgJsonPath)) {
    try {
      const pkgContent = readFileSync(ctx.pkgJsonPath, "utf-8");
      hasSentryDep = pkgContent.includes("@sentry/");
      hasDatadogDep = pkgContent.includes("datadog-ci");
    } catch {
      // ignore parse failures
    }
  }

  const hasSentryEnv = findFiles(ctx.targetDir, /^\.env\.sentry/i, 1).length > 0;
  const hasModernObs =
    sentryFiles.length > 0 || hasVercelJson || hasNetlifyToml || hasSentryDep || hasDatadogDep || hasSentryEnv;

  if (hasTraditionalObs || hasModernObs) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push("Observability configuration found");
    return;
  }

  if (!ctx.isCliRepo) {
    result.scores.agent_legibility.findings.push("No observability stack detected");
    return;
  }

  const cliDiagSignals = detectCliDiagnosabilitySignals(ctx.targetDir);
  if (cliDiagSignals.length >= 2) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push(`CLI diagnosability signals found (${cliDiagSignals.join(", ")})`);
  } else {
    result.scores.agent_legibility.findings.push("No observability or CLI diagnosability signals detected");
  }
}

function scoreMonorepoDependencyFootprint(result: AuditResult, ctx: AuditRuntimeContext): void {
  const workspacePkgFiles = findFiles(ctx.targetDir, /^package\.json$/, 3).filter(
    (file) => file !== ctx.pkgJsonPath && !file.includes("node_modules"),
  );
  if (workspacePkgFiles.length === 0) return;

  let totalDeps = 0;
  let counted = 0;
  for (const workspacePkg of workspacePkgFiles) {
    try {
      const workspacePkgData = JSON.parse(readFileSync(workspacePkg, "utf-8"));
      totalDeps += Object.keys(workspacePkgData.dependencies || {}).length;
      counted++;
    } catch {
      // ignore parse failures
    }
  }

  if (counted === 0) {
    result.scores.agent_legibility.findings.push(
      "No readable workspace package.json files for dependency footprint analysis",
    );
    return;
  }

  const avgDeps = Math.round(totalDeps / counted);
  if (avgDeps < 30) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push(
      `Lean workspace dependencies (avg ${avgDeps} across ${counted} packages)`,
    );
  } else {
    result.scores.agent_legibility.findings.push(
      `Heavy workspace dependencies (avg ${avgDeps} across ${counted} packages) — consider trimming`,
    );
  }
}

function scoreSinglePackageDependencyFootprint(result: AuditResult, ctx: AuditRuntimeContext): void {
  const pkg = JSON.parse(readFileSync(ctx.pkgJsonPath, "utf-8"));
  const depCount = Object.keys(pkg.dependencies || {}).length;
  if (depCount < 20) {
    result.scores.agent_legibility.score++;
    result.scores.agent_legibility.findings.push(`Lean dependency set (${depCount} dependencies)`);
  } else {
    result.scores.agent_legibility.findings.push(`Heavy dependency set (${depCount} dependencies) — consider trimming`);
  }
}

function scoreDependencyFootprint(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (!existsSync(ctx.pkgJsonPath)) return;

  try {
    if (ctx.isMonorepo) {
      scoreMonorepoDependencyFootprint(result, ctx);
      return;
    }

    scoreSinglePackageDependencyFootprint(result, ctx);
  } catch {
    // ignore parse failures
  }
}

function scoreAgentLegibility(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (existsSync(ctx.pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(ctx.pkgJsonPath, "utf-8"));
      if (pkg.scripts?.dev || pkg.scripts?.start) {
        result.scores.agent_legibility.score++;
        result.scores.agent_legibility.findings.push("App has dev/start script (bootable)");
      } else if (ctx.isMonorepo && hasBootableWorkspace(ctx)) {
        result.scores.agent_legibility.score++;
        result.scores.agent_legibility.findings.push(
          `Monorepo detected with ${ctx.monorepoWorkspaces.length} workspace(s), bootable workspace found`,
        );
      }
    } catch {
      // ignore parse failures
    }
  }

  scoreObservability(result, ctx);
  scoreDependencyFootprint(result, ctx);
}

function scoreGoldenPrinciples(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (existsSync(ctx.goldenPath)) {
    result.scores.golden_principles.score++;
    const goldenContent = readFileSync(ctx.goldenPath, "utf-8");
    const principleCount = countGoldenPrinciples(goldenContent);

    if (principleCount >= 5) {
      result.scores.golden_principles.findings.push(`Golden principles documented (${principleCount} principles)`);
    } else {
      result.scores.golden_principles.findings.push(
        `Golden principles documented — only ${principleCount} principles, consider adding more`,
      );
    }

    if (/anti-pattern|don['']t|never|avoid/i.test(goldenContent)) {
      result.scores.golden_principles.findings.push("Anti-patterns documented");
    }
  } else {
    result.scores.golden_principles.findings.push("No golden principles document");
    result.recommendations.push("Create docs/golden-principles.md with mechanical taste rules");
  }

  const ciPaths = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"];
  const hasCI = ciPaths.some((path) => existsSync(join(ctx.targetDir, path)));
  if (hasCI) {
    result.scores.golden_principles.score++;
    result.scores.golden_principles.findings.push("CI pipeline exists for enforcement");

    if (ctx.ciEnforcementSteps.length >= 3) {
      result.scores.golden_principles.findings.push(
        `CI enforces ${ctx.ciEnforcementSteps.length} quality gates (${ctx.ciEnforcementSteps.join(", ")})`,
      );
    }
  } else {
    result.scores.golden_principles.findings.push("No CI pipeline detected");
  }

  if (ctx.hasCleanupDocs) {
    result.scores.golden_principles.score++;
    result.scores.golden_principles.findings.push("Tech debt tracker exists");
  }
}

function scoreAgentWorkflowConfig(result: AuditResult, ctx: AuditRuntimeContext): void {
  const agentConfigs = ["CLAUDE.md", ".claude", "CODEX.md", ".cursor", "conductor.json"];
  const hasAgentConfig = agentConfigs.some((file) => existsSync(join(ctx.targetDir, file)));
  if (hasAgentConfig) {
    result.scores.agent_workflow.score++;
    result.scores.agent_workflow.findings.push("Agent configuration found");
  } else {
    result.scores.agent_workflow.findings.push("No agent configuration (CLAUDE.md, .cursor, conductor.json, etc.)");
  }
}

function scoreAgentWorkflowGovernance(result: AuditResult, ctx: AuditRuntimeContext): void {
  const hasPRTemplate =
    existsSync(join(ctx.targetDir, ".github", "pull_request_template.md")) ||
    existsSync(join(ctx.targetDir, ".github", "PULL_REQUEST_TEMPLATE.md"));
  const hasIssueTemplates = existsSync(join(ctx.targetDir, ".github", "ISSUE_TEMPLATE"));
  const hasConductor = existsSync(join(ctx.targetDir, "conductor.json"));
  if (hasPRTemplate || ctx.hasRiskPolicy || hasIssueTemplates || hasConductor) {
    result.scores.agent_workflow.score++;
    const signals: string[] = [];
    if (hasPRTemplate) signals.push("PR template");
    if (ctx.hasRiskPolicy) signals.push("risk-policy.json");
    if (hasIssueTemplates) signals.push("issue templates");
    if (hasConductor) signals.push("conductor.json");
    result.scores.agent_workflow.findings.push(`Workflow governance found (${signals.join(", ")})`);
  }
}

function scoreAgentWorkflowCi(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (existsSync(ctx.workflowDir)) {
    const workflowEnforcement = ctx.ciEnforcementSteps.filter((step) =>
      ["lint", "test", "build", "typecheck", "type-check"].includes(step),
    );
    if (workflowEnforcement.length >= 2) {
      result.scores.agent_workflow.score++;
      result.scores.agent_workflow.findings.push(`CI workflows with enforcement (${workflowEnforcement.join(", ")})`);
    } else {
      result.scores.agent_workflow.findings.push("CI workflows exist but lack sufficient enforcement steps (need 2+)");
    }
  }
}

function scoreAgentWorkflow(result: AuditResult, ctx: AuditRuntimeContext): void {
  scoreAgentWorkflowConfig(result, ctx);
  scoreAgentWorkflowGovernance(result, ctx);
  scoreAgentWorkflowCi(result, ctx);
}

function hasActiveDocGardening(ctx: AuditRuntimeContext): boolean {
  const hasDocGardeningIndex = existsSync(join(ctx.targetDir, "docs", "design-docs", "index.md"));
  if (hasDocGardeningIndex) {
    const docGardeningContent = readFileSync(join(ctx.targetDir, "docs", "design-docs", "index.md"), "utf-8");
    if (/verif|status|last.*check/i.test(docGardeningContent)) return true;
  }

  const docGardenerScripts = existsSync(join(ctx.targetDir, "scripts"))
    ? findFiles(join(ctx.targetDir, "scripts"), /doc-gardener|freshness/i, 1)
    : [];
  if (docGardenerScripts.length > 0) return true;

  return ctx.verifiedDocs.length >= 3;
}

function hasQualityGrades(ctx: AuditRuntimeContext): boolean {
  if (!existsSync(ctx.archMdPath)) return false;
  const architectureContent = readFileSync(ctx.archMdPath, "utf-8");
  return /quality.*grade|grade/i.test(architectureContent);
}

function hasDriftEnforcement(ctx: AuditRuntimeContext): boolean {
  let riskPolicyDrift = false;
  if (ctx.hasRiskPolicy) {
    try {
      const riskPolicyContent = readFileSync(join(ctx.targetDir, "risk-policy.json"), "utf-8");
      riskPolicyDrift = /docsDriftRules|watchPaths/i.test(riskPolicyContent);
    } catch {
      // ignore parse failures
    }
  }

  const docsDriftScripts = existsSync(join(ctx.targetDir, "scripts"))
    ? findFiles(join(ctx.targetDir, "scripts"), /drift|docs-drift/i, 1)
    : [];
  return riskPolicyDrift || docsDriftScripts.length > 0;
}

function scoreGarbageCollection(result: AuditResult, ctx: AuditRuntimeContext): void {
  if (ctx.hasCleanupDocs) {
    result.scores.garbage_collection.score++;
    result.scores.garbage_collection.findings.push("Tech debt tracked in-repo");
  } else {
    result.scores.garbage_collection.findings.push("No tech debt tracking");
  }

  if (hasActiveDocGardening(ctx)) {
    result.scores.garbage_collection.score++;
    result.scores.garbage_collection.findings.push("Active doc-gardening detected");
  }

  const qualityGradesFound = hasQualityGrades(ctx);
  const driftEnforcement = hasDriftEnforcement(ctx);

  if (qualityGradesFound || driftEnforcement) {
    result.scores.garbage_collection.score++;
    if (qualityGradesFound) {
      result.scores.garbage_collection.findings.push("Quality grades tracked in architecture");
    }
    if (driftEnforcement) {
      result.scores.garbage_collection.findings.push("Drift enforcement detected");
    }
  }
}

export function applyAuditScoring(result: AuditResult, ctx: AuditRuntimeContext): void {
  scoreRepositoryKnowledge(result, ctx);
  scoreArchitectureEnforcement(result, ctx);
  scoreAgentLegibility(result, ctx);
  scoreGoldenPrinciples(result, ctx);
  scoreAgentWorkflow(result, ctx);
  scoreGarbageCollection(result, ctx);
}

export function resolveMaturityLevel(totalScore: number): string {
  if (totalScore <= 4) return "L0: Manual";
  if (totalScore <= 8) return "L1: Assisted";
  if (totalScore <= 13) return "L2: Steered";
  if (totalScore <= 16) return "L3: Autonomous";
  return "L4: Self-Correcting";
}
