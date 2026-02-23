import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectCliProject, detectMonorepoWorkspaces, scanWorkflowsForEnforcement } from "../detection";
import { findFiles } from "../filesystem";
import type { AuditResult } from "../types";

export interface AuditRuntimeContext {
  targetDir: string;
  pkgJsonPath: string;
  docsDir: string;
  execPlansDir: string;
  archMdPath: string;
  workflowDir: string;
  goldenPath: string;
  hasRiskPolicy: boolean;
  hasEslint: boolean;
  hasBiome: boolean;
  hasStructuralLintScript: boolean;
  ciEnforcementSteps: string[];
  monorepoWorkspaces: string[];
  isMonorepo: boolean;
  isCliRepo: boolean;
  verifiedDocs: string[];
  hasCleanupDocs: boolean;
}

export function createAuditResult(projectName: string): AuditResult {
  return {
    project: projectName,
    timestamp: new Date().toISOString(),
    scores: {
      repository_knowledge: { score: 0, max: 3, findings: [] },
      architecture_enforcement: { score: 0, max: 3, findings: [] },
      agent_legibility: { score: 0, max: 3, findings: [] },
      golden_principles: { score: 0, max: 3, findings: [] },
      agent_workflow: { score: 0, max: 3, findings: [] },
      garbage_collection: { score: 0, max: 3, findings: [] },
    },
    total_score: 0,
    max_score: 18,
    maturity_level: "L0",
    recommendations: [],
  };
}

export function readVerifiedDocs(targetDir: string): string[] {
  const allDocFiles = findFiles(targetDir, /\.(md|markdown)$/);
  return allDocFiles.filter((file) => {
    try {
      return readFileSync(file, "utf-8").includes("<!-- Verified:");
    } catch {
      return false;
    }
  });
}

export function buildAuditRuntimeContext(targetDir: string): AuditRuntimeContext {
  const pkgJsonPath = join(targetDir, "package.json");
  const docsDir = join(targetDir, "docs");
  const workflowDir = join(targetDir, ".github", "workflows");
  const archMdPath = join(targetDir, "ARCHITECTURE.md");
  const goldenPath = join(targetDir, "docs", "golden-principles.md");
  const execPlansDir = join(targetDir, "docs", "exec-plans");
  const hasRiskPolicy = existsSync(join(targetDir, "risk-policy.json"));
  const hasEslint =
    existsSync(join(targetDir, ".eslintrc.json")) ||
    existsSync(join(targetDir, ".eslintrc.js")) ||
    existsSync(join(targetDir, "eslint.config.js")) ||
    existsSync(join(targetDir, "eslint.config.mjs"));
  const hasBiome = existsSync(join(targetDir, "biome.json"));
  const structuralLintScripts = existsSync(join(targetDir, "scripts"))
    ? findFiles(join(targetDir, "scripts"), /lint|structure/i, 1)
    : [];
  const hasStructuralLintScript = structuralLintScripts.length > 0;
  const ciEnforcementSteps = existsSync(workflowDir) ? scanWorkflowsForEnforcement(workflowDir) : [];
  const monorepoWorkspaces = existsSync(pkgJsonPath) ? detectMonorepoWorkspaces(pkgJsonPath) : [];
  const isMonorepo = monorepoWorkspaces.length > 0;
  const isCliRepo = detectCliProject(targetDir, pkgJsonPath);
  const verifiedDocs = readVerifiedDocs(targetDir);
  const hasCleanupDocs = existsSync(join(targetDir, "docs", "exec-plans", "tech-debt-tracker.md"));

  return {
    targetDir,
    pkgJsonPath,
    docsDir,
    execPlansDir,
    archMdPath,
    workflowDir,
    goldenPath,
    hasRiskPolicy,
    hasEslint,
    hasBiome,
    hasStructuralLintScript,
    ciEnforcementSteps,
    monorepoWorkspaces,
    isMonorepo,
    isCliRepo,
    verifiedDocs,
    hasCleanupDocs,
  };
}
