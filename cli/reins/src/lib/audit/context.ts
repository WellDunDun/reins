import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  checkWorkflowConfigForPattern,
  checkWorkflowsForMergeProtection,
  detectCliProject,
  detectMonorepoWorkspaces,
  scanWorkflowsForEnforcement,
} from "../detection";
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
  hasAgentCommands: boolean;
  hasSessionOrchestrator: boolean;
  hasMcpConfig: boolean;
  hasGlobBasedRules: boolean;
  hierarchicalAgentContextCount: number;
  hasSkillsManifest: boolean;
  hasWorkflowConfig: boolean;
  hasSkillsDirectory: boolean;
  hasIsolationPolicy: boolean;
  hasConcurrencyLimits: boolean;
  hasMergeProtection: boolean;
  hasSpecDocument: boolean;
  hasHooksConfig: boolean;
  hasBackPressure: boolean;
  mcpToolCount: number;
  customChecks: CustomCheck[];
  frameworksDetected: string[];
}

export interface CustomCheck {
  name: string;
  type: "file-exists" | "file-contains";
  path: string;
  pattern?: string;
  dimension: string;
}

export function createAuditResult(projectName: string): AuditResult {
  return {
    project: projectName,
    schema_version: "2.0",
    timestamp: new Date().toISOString(),
    scores: {
      repository_knowledge: { score: 0, max: 4, findings: [] },
      architecture_enforcement: { score: 0, max: 3, findings: [] },
      agent_legibility: { score: 0, max: 5, findings: [] },
      golden_principles: { score: 0, max: 3, findings: [] },
      agent_workflow: { score: 0, max: 6, findings: [] },
      garbage_collection: { score: 0, max: 3, findings: [] },
    },
    total_score: 0,
    max_score: 24,
    maturity_level: "L0",
    recommendations: [],
    frameworks_detected: [],
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

function detectAgentCommands(targetDir: string): boolean {
  const commandsDir = join(targetDir, ".claude", "commands");
  if (!existsSync(commandsDir)) return false;
  try {
    return readdirSync(commandsDir).length > 0;
  } catch {
    return false;
  }
}

function detectNonEmptySkillsDirectory(targetDir: string): boolean {
  const skillsDirPaths = [
    join(targetDir, ".codex", "skills"),
    join(targetDir, ".claude", "skills"),
    join(targetDir, ".claude", "commands"),
    join(targetDir, "skills"),
  ];
  return skillsDirPaths.some((d) => {
    if (!existsSync(d)) return false;
    try {
      return readdirSync(d).length > 0;
    } catch {
      return false;
    }
  });
}

function detectConcurrencyLimits(targetDir: string, hasWorkflowConfig: boolean, hasRiskPolicy: boolean): boolean {
  if (hasWorkflowConfig && checkWorkflowConfigForPattern(targetDir, /max_concurrent|concurrency/i)) return true;
  if (!hasRiskPolicy) return false;
  try {
    const content = readFileSync(join(targetDir, "risk-policy.json"), "utf-8");
    return /concurrency|maxConcurrentAgents/i.test(content);
  } catch {
    return false;
  }
}

function detectHooksConfig(targetDir: string): boolean {
  const hookPaths = [
    join(targetDir, ".claude", "settings.json"),
    join(targetDir, ".husky"),
    join(targetDir, ".githooks"),
    join(targetDir, ".lefthook.yml"),
    join(targetDir, "lefthook.yml"),
  ];
  for (const hookPath of hookPaths) {
    if (!existsSync(hookPath)) continue;
    if (hookPath.endsWith("settings.json")) {
      try {
        const content = readFileSync(hookPath, "utf-8");
        if (/hooks/i.test(content)) return true;
      } catch {
        // ignore
      }
    } else {
      return true;
    }
  }
  return false;
}

function detectBackPressure(targetDir: string, pkgJsonPath: string): boolean {
  // JS/TS: package.json scripts
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      const scripts = pkg.scripts || {};
      const hasTest = "test" in scripts;
      const hasTypecheck = "typecheck" in scripts || "type-check" in scripts || "tsc" in scripts;
      if (hasTest && hasTypecheck) return true;
    } catch {
      // ignore
    }
  }

  // Makefile: test target
  const makefilePath = join(targetDir, "Makefile");
  if (existsSync(makefilePath)) {
    try {
      const content = readFileSync(makefilePath, "utf-8");
      if (/^test\s*:/m.test(content) && (/^lint\s*:/m.test(content) || /^check\s*:/m.test(content))) return true;
    } catch {
      // ignore
    }
  }

  // Python: pyproject.toml with test framework
  const pyprojectPath = join(targetDir, "pyproject.toml");
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, "utf-8");
      const hasTestTool = /\[tool\.(pytest|mypy|pyright)\]/i.test(content);
      if (hasTestTool) return true;
    } catch {
      // ignore
    }
  }

  // Rust: Cargo.toml (Rust has built-in test + type checking)
  if (existsSync(join(targetDir, "Cargo.toml"))) return true;

  return false;
}

function countMcpTools(targetDir: string): number {
  const mcpPaths = [
    join(targetDir, ".claude", "mcp.json"),
    join(targetDir, ".cursor", "mcp.json"),
    join(targetDir, "mcp.json"),
  ];
  for (const mcpPath of mcpPaths) {
    if (!existsSync(mcpPath)) continue;
    try {
      const config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      const servers = config.mcpServers || config.servers || config;
      if (typeof servers === "object" && !Array.isArray(servers)) {
        return Object.keys(servers).length;
      }
    } catch {
      // ignore
    }
  }
  return 0;
}

function loadCustomChecks(targetDir: string): CustomCheck[] {
  const checksPath = join(targetDir, ".reins", "custom-checks.json");
  if (!existsSync(checksPath)) return [];
  try {
    const config = JSON.parse(readFileSync(checksPath, "utf-8"));
    if (!Array.isArray(config.checks)) return [];
    return config.checks.filter(
      (c: unknown): c is CustomCheck =>
        typeof c === "object" &&
        c !== null &&
        "name" in c &&
        "type" in c &&
        "path" in c &&
        "dimension" in c &&
        ((c as CustomCheck).type === "file-exists" || (c as CustomCheck).type === "file-contains"),
    );
  } catch {
    return [];
  }
}

function detectFrameworks(targetDir: string): string[] {
  const detected: string[] = [];
  if (existsSync(join(targetDir, ".codex")) || existsSync(join(targetDir, "WORKFLOW.md"))) detected.push("symphony");
  if (existsSync(join(targetDir, "CLAUDE.md")) || existsSync(join(targetDir, ".claude"))) detected.push("claude-code");
  if (existsSync(join(targetDir, ".cursor"))) detected.push("cursor");
  if (existsSync(join(targetDir, "conductor.json"))) detected.push("conductor");
  if (existsSync(join(targetDir, "CODEX.md"))) detected.push("codex");
  return detected;
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
  const hasAgentCommands = detectAgentCommands(targetDir);

  const hasSessionOrchestrator =
    existsSync(join(targetDir, ".flow")) ||
    existsSync(join(targetDir, "gsd")) ||
    existsSync(join(targetDir, "conductor.json")) ||
    existsSync(join(targetDir, ".claude", "settings.json"));

  const hasMcpConfig =
    existsSync(join(targetDir, ".claude", "mcp.json")) ||
    existsSync(join(targetDir, ".cursor", "mcp.json")) ||
    existsSync(join(targetDir, "mcp.json"));

  const hasGlobBasedRules =
    existsSync(join(targetDir, ".cursor", "rules")) || existsSync(join(targetDir, ".claude", "rules"));

  const agentContextFiles = [...findFiles(targetDir, /^AGENTS\.md$/, 3), ...findFiles(targetDir, /^CLAUDE\.md$/, 3)];
  const hierarchicalAgentContextCount = agentContextFiles.length;

  const hasSkillsManifest =
    existsSync(join(targetDir, "skills.json")) ||
    existsSync(join(targetDir, ".claude", "skills")) ||
    existsSync(join(targetDir, ".cursor", "extensions"));

  const hasWorkflowConfig =
    existsSync(join(targetDir, "WORKFLOW.md")) ||
    existsSync(join(targetDir, "workflow.yml")) ||
    existsSync(join(targetDir, ".codex", "WORKFLOW.md"));

  const hasSkillsDirectory = detectNonEmptySkillsDirectory(targetDir);

  const hasIsolationPolicy =
    existsSync(join(targetDir, "sandbox.json")) ||
    existsSync(join(targetDir, ".sandbox")) ||
    (hasWorkflowConfig && checkWorkflowConfigForPattern(targetDir, /sandbox|isolat|workspace.*root/i));

  const hasConcurrencyLimits = detectConcurrencyLimits(targetDir, hasWorkflowConfig, hasRiskPolicy);

  const hasMergeProtection =
    existsSync(join(targetDir, ".github", "CODEOWNERS")) ||
    existsSync(join(targetDir, "CODEOWNERS")) ||
    checkWorkflowsForMergeProtection(workflowDir);

  const hasSpecDocument = existsSync(join(targetDir, "SPEC.md")) || existsSync(join(targetDir, "spec.md"));
  const hasHooksConfig = detectHooksConfig(targetDir);
  const hasBackPressure = detectBackPressure(targetDir, pkgJsonPath);
  const mcpToolCount = countMcpTools(targetDir);
  const customChecks = loadCustomChecks(targetDir);

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
    hasAgentCommands,
    hasSessionOrchestrator,
    hasMcpConfig,
    hasGlobBasedRules,
    hierarchicalAgentContextCount,
    hasSkillsManifest,
    hasWorkflowConfig,
    hasSkillsDirectory,
    hasIsolationPolicy,
    hasConcurrencyLimits,
    hasMergeProtection,
    hasSpecDocument,
    hasHooksConfig,
    hasBackPressure,
    mcpToolCount,
    customChecks,
    frameworksDetected: detectFrameworks(targetDir),
  };
}
