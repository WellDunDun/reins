import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findFiles } from "./filesystem";

export function scanWorkflowsForEnforcement(workflowDir: string): string[] {
  const steps: Set<string> = new Set();
  const keywordPatterns: Array<{ step: string; pattern: RegExp }> = [
    { step: "lint", pattern: /\b(lint|eslint|biome\s+check)\b/ },
    { step: "test", pattern: /\b(test|vitest|jest)\b/ },
    { step: "typecheck", pattern: /\b(typecheck|type-check|tsc\s+--no-?emit)\b/ },
    { step: "build", pattern: /\bbuild\b/ },
    { step: "audit", pattern: /\baudit\b/ },
    { step: "prettier", pattern: /\bprettier\b/ },
    { step: "format", pattern: /\bformat\b/ },
  ];
  try {
    const files = readdirSync(workflowDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
    for (const file of files) {
      const content = readFileSync(join(workflowDir, file), "utf-8").toLowerCase();
      for (const { step, pattern } of keywordPatterns) {
        if (pattern.test(content)) steps.add(step);
      }
    }
  } catch {
    // no workflows
  }
  return [...steps];
}

export function detectMonorepoWorkspaces(pkgJsonPath: string): string[] {
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const workspaces = pkg.workspaces?.packages || pkg.workspaces;
    if (Array.isArray(workspaces)) return workspaces;
  } catch {}
  return [];
}

function isCliPackage(pkg: Record<string, unknown>): boolean {
  const hasBin =
    typeof pkg.bin === "string" ||
    (typeof pkg.bin === "object" && pkg.bin !== null && Object.keys(pkg.bin as Record<string, unknown>).length > 0);
  const hasCliName = typeof pkg.name === "string" && /(^|[-_])cli($|[-_])/.test(pkg.name);
  const hasCliKeywords =
    Array.isArray(pkg.keywords) &&
    pkg.keywords.some((k) => typeof k === "string" && /(cli|command-?line|terminal)/i.test(k));
  return hasBin || hasCliName || hasCliKeywords;
}

export function detectCliProject(targetDir: string, rootPkgJsonPath: string): boolean {
  if (existsSync(rootPkgJsonPath)) {
    try {
      const rootPkg = JSON.parse(readFileSync(rootPkgJsonPath, "utf-8"));
      if (isCliPackage(rootPkg)) return true;
    } catch {
      // ignore parse errors
    }
  }

  const pkgJsonFiles = findFiles(targetDir, /^package\.json$/, 4).filter(
    (f) => f !== rootPkgJsonPath && !f.includes("node_modules"),
  );
  for (const pkgPath of pkgJsonFiles) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (isCliPackage(pkg)) return true;
    } catch {
      // ignore parse errors
    }
  }
  return false;
}

function detectReadmeSignals(targetDir: string): string[] {
  const readmePath = join(targetDir, "README.md");
  if (!existsSync(readmePath)) return [];

  try {
    const readmeContent = readFileSync(readmePath, "utf-8");
    return /\bdoctor\b|\bhealth check\b/i.test(readmeContent) ? ["doctor docs"] : [];
  } catch {
    return [];
  }
}

function detectWorkflowSignals(targetDir: string): string[] {
  const workflowDir = join(targetDir, ".github", "workflows");
  if (!existsSync(workflowDir)) return [];

  try {
    const files = readdirSync(workflowDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
    for (const file of files) {
      const workflowContent = readFileSync(join(workflowDir, file), "utf-8");
      if (/\baudit\b|\bdoctor\b/i.test(workflowContent)) return ["ci diagnostic checks"];
    }
  } catch {
    return [];
  }

  return [];
}

function detectSourceSignals(targetDir: string): string[] {
  const sourceFiles = findFiles(targetDir, /^index\.(ts|js|mjs|cjs)$/, 5).filter((f) => !f.includes("node_modules"));
  for (const file of sourceFiles) {
    try {
      const sourceContent = readFileSync(file, "utf-8");
      if (/function\s+doctor\s*\(|--help|Unknown command|printHelp/i.test(sourceContent)) {
        return ["cli diagnostic command surface"];
      }
    } catch {
      // ignore read errors
    }
  }

  return [];
}

function detectTestSignals(targetDir: string): string[] {
  const testFiles = findFiles(targetDir, /\.(test|spec)\.(ts|js|mjs|cjs)$/, 5).filter(
    (f) => !f.includes("node_modules"),
  );
  for (const file of testFiles) {
    try {
      const testContent = readFileSync(file, "utf-8");
      if (/--help|Unknown command|doctor/i.test(testContent)) return ["cli diagnostic tests"];
    } catch {
      // ignore read errors
    }
  }

  return [];
}

export function detectCliDiagnosabilitySignals(targetDir: string): string[] {
  const signals = new Set<string>();
  const probes = [
    detectReadmeSignals(targetDir),
    detectWorkflowSignals(targetDir),
    detectSourceSignals(targetDir),
    detectTestSignals(targetDir),
  ];

  for (const probeSignals of probes) {
    for (const signal of probeSignals) {
      signals.add(signal);
    }
  }

  return [...signals];
}
