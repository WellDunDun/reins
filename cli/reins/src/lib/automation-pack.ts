import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findFiles } from "./filesystem";
import { getAgentFactoryPackFiles } from "./templates";

export type AutomationPack = "none" | "auto" | "agent-factory";
export type ResolvedAutomationPack = "none" | "agent-factory";

export interface PackResolution {
  requested: AutomationPack;
  selected: ResolvedAutomationPack;
  reason: string;
}

export function normalizeAutomationPack(raw: string): AutomationPack | null {
  const value = raw.trim().toLowerCase();
  if (!value || value === "none") return "none";
  if (value === "auto") return "auto";
  if (value === "agent-factory") return "agent-factory";
  return null;
}

export function hasAgentFactoryPack(targetDir: string): boolean {
  const requiredPaths = [
    "scripts/lint-structure.mjs",
    "scripts/doc-gardener.mjs",
    "scripts/check-changed-doc-freshness.mjs",
    "scripts/pr-review.mjs",
    ".github/workflows/risk-policy-gate.yml",
    ".github/workflows/pr-review-bot.yml",
    ".github/workflows/structural-lint.yml",
  ];
  return requiredPaths.every((path) => existsSync(join(targetDir, path)));
}

export function recommendAutomationPack(targetDir: string): PackResolution {
  const hasPackageJson = existsSync(join(targetDir, "package.json"));
  const hasJsTsSources = findFiles(targetDir, /\.(ts|tsx|js|jsx|mjs|cjs)$/, 2).length > 0;
  const hasGithubConfig = existsSync(join(targetDir, ".github")) || existsSync(join(targetDir, ".github", "workflows"));

  const nonNodeSignals = [
    "go.mod",
    "Cargo.toml",
    "pyproject.toml",
    "requirements.txt",
    "pom.xml",
    "build.gradle",
    "Gemfile",
  ];
  const hasNonNodeOnlySignals = nonNodeSignals.some((file) => existsSync(join(targetDir, file)));

  if (hasPackageJson) {
    return {
      requested: "auto",
      selected: "agent-factory",
      reason: "Detected package.json (Node/JS project). Applying agent-factory automation pack.",
    };
  }

  if (hasJsTsSources && hasGithubConfig) {
    return {
      requested: "auto",
      selected: "agent-factory",
      reason: "Detected JS/TS sources with GitHub workflow usage. Applying agent-factory automation pack.",
    };
  }

  if (hasNonNodeOnlySignals && !hasJsTsSources && !hasPackageJson) {
    return {
      requested: "auto",
      selected: "none",
      reason: "Detected non-JS stack signals. Keeping base scaffold; choose stack-specific automation manually.",
    };
  }

  return {
    requested: "auto",
    selected: "none",
    reason: "Insufficient stack signals for safe auto-pack selection. Keeping base scaffold.",
  };
}

export function resolveAutomationPack(targetDir: string, requested: AutomationPack): PackResolution {
  if (requested === "auto") {
    return recommendAutomationPack(targetDir);
  }

  if (requested === "agent-factory") {
    return {
      requested,
      selected: "agent-factory",
      reason: "Explicitly requested agent-factory automation pack.",
    };
  }

  return {
    requested,
    selected: "none",
    reason: "No optional automation pack selected.",
  };
}

export function scaffoldAutomationPack(targetDir: string, pack: ResolvedAutomationPack, force: boolean): string[] {
  if (pack === "none") return [];

  const created: string[] = [];
  const packDirs = ["scripts", ".github/workflows"];
  for (const dir of packDirs) {
    const fullPath = join(targetDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      created.push(`${dir}/`);
    }
  }

  for (const file of getAgentFactoryPackFiles()) {
    const fullPath = join(targetDir, file.path);
    if (!existsSync(fullPath) || force) {
      writeFileSync(fullPath, file.content);
      created.push(file.path);
    }
  }

  return created;
}
