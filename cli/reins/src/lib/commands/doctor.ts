import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { readVerifiedDocs } from "../audit/context";
import { scanWorkflowsForEnforcement } from "../detection";
import { findFiles } from "../filesystem";
import type { DoctorCheck } from "../types";

function collectDoctorAgentsCheck(targetDir: string): DoctorCheck[] {
  const agentsMd = join(targetDir, "AGENTS.md");
  if (!existsSync(agentsMd)) {
    return [{ check: "AGENTS.md missing", status: "fail", fix: "Run 'reins init .' to create AGENTS.md" }];
  }

  const lines = readFileSync(agentsMd, "utf-8").split("\n").length;
  if (lines <= 150) {
    return [{ check: "AGENTS.md exists and concise", status: "pass", fix: "" }];
  }

  return [
    {
      check: "AGENTS.md too long",
      status: "warn",
      fix: `Trim AGENTS.md from ${lines} to ~100 lines. Move details to docs/.`,
    },
  ];
}

function collectDoctorArchitectureCheck(targetDir: string): DoctorCheck[] {
  if (existsSync(join(targetDir, "ARCHITECTURE.md"))) {
    return [{ check: "ARCHITECTURE.md exists", status: "pass", fix: "" }];
  }

  return [
    {
      check: "ARCHITECTURE.md missing",
      status: "fail",
      fix: "Run 'reins init .' to create ARCHITECTURE.md",
    },
  ];
}

function collectDoctorRequiredDocChecks(targetDir: string): DoctorCheck[] {
  const requiredDocs = [
    "docs/design-docs/index.md",
    "docs/design-docs/core-beliefs.md",
    "docs/product-specs/index.md",
    "docs/exec-plans/tech-debt-tracker.md",
    "docs/golden-principles.md",
  ];

  return requiredDocs.map((doc): DoctorCheck => {
    if (existsSync(join(targetDir, doc))) {
      return { check: `${doc} exists`, status: "pass", fix: "" };
    }

    return {
      check: `${doc} missing`,
      status: "fail",
      fix: "Run 'reins init .' to create missing files",
    };
  });
}

function collectDoctorLinterCheck(targetDir: string): DoctorCheck[] {
  const linterFiles = [".eslintrc.json", ".eslintrc.js", "eslint.config.js", "eslint.config.mjs", "biome.json"];
  if (linterFiles.some((file) => existsSync(join(targetDir, file)))) {
    return [{ check: "Linter configured", status: "pass", fix: "" }];
  }

  return [
    {
      check: "No linter configured",
      status: "warn",
      fix: "Add eslint or biome config to enforce architectural constraints",
    },
  ];
}

function collectDoctorCiChecks(targetDir: string): DoctorCheck[] {
  const doctorCiPaths = [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile"];
  const hasCiPipeline = doctorCiPaths.some((path) => existsSync(join(targetDir, path)));
  if (!hasCiPipeline) {
    return [
      {
        check: "No CI pipeline",
        status: "warn",
        fix: "Add CI pipeline to enforce golden principles mechanically",
      },
    ];
  }

  const checks: DoctorCheck[] = [{ check: "CI pipeline exists", status: "pass", fix: "" }];
  const doctorWorkflowDir = join(targetDir, ".github", "workflows");
  if (!existsSync(doctorWorkflowDir)) return checks;

  const enforcementSteps = scanWorkflowsForEnforcement(doctorWorkflowDir);
  if (enforcementSteps.length >= 2) {
    checks.push({ check: `CI enforces ${enforcementSteps.length} quality gates`, status: "pass", fix: "" });
  } else {
    checks.push({
      check: "CI lacks enforcement steps",
      status: "warn",
      fix: "Add lint, test, and typecheck steps to CI workflows",
    });
  }

  return checks;
}

function collectDoctorRiskPolicyCheck(targetDir: string): DoctorCheck[] {
  if (existsSync(join(targetDir, "risk-policy.json"))) {
    return [{ check: "risk-policy.json exists", status: "pass", fix: "" }];
  }

  return [
    {
      check: "No risk-policy.json",
      status: "warn",
      fix: "Create risk-policy.json with risk tiers and docs-drift rules",
    },
  ];
}

function collectDoctorVerificationChecks(targetDir: string): DoctorCheck[] {
  const verifiedDocs = readVerifiedDocs(targetDir);
  if (verifiedDocs.length > 0) {
    return [{ check: `Verification headers in ${verifiedDocs.length} doc(s)`, status: "pass", fix: "" }];
  }

  return [
    {
      check: "No verification headers in docs",
      status: "warn",
      fix: "Add <!-- Verified: YYYY-MM-DD --> headers to key docs for freshness tracking",
    },
  ];
}

function collectDoctorHierarchicalAgentsCheck(targetDir: string): DoctorCheck[] {
  const agentsMdFiles = findFiles(targetDir, /^AGENTS\.md$/, 3);
  if (agentsMdFiles.length >= 2) {
    return [{ check: `Hierarchical AGENTS.md (${agentsMdFiles.length} files)`, status: "pass", fix: "" }];
  }

  return [];
}

function collectDoctorStructuralLintChecks(targetDir: string): DoctorCheck[] {
  if (!existsSync(join(targetDir, "scripts"))) return [];

  const structuralScripts = findFiles(join(targetDir, "scripts"), /lint|structure/i, 1);
  if (structuralScripts.length > 0) {
    return [{ check: "Structural lint scripts found", status: "pass", fix: "" }];
  }

  return [
    {
      check: "No structural lint scripts",
      status: "warn",
      fix: "Add scripts/structural-lint.ts to enforce layer and dependency rules",
    },
  ];
}

export function runDoctor(targetPath: string): void {
  const targetDir = resolve(targetPath);
  if (!existsSync(targetDir)) {
    console.error(JSON.stringify({ error: `Directory does not exist: ${targetDir}` }));
    process.exit(1);
  }

  const checks: DoctorCheck[] = [
    ...collectDoctorAgentsCheck(targetDir),
    ...collectDoctorArchitectureCheck(targetDir),
    ...collectDoctorRequiredDocChecks(targetDir),
    ...collectDoctorLinterCheck(targetDir),
    ...collectDoctorCiChecks(targetDir),
    ...collectDoctorRiskPolicyCheck(targetDir),
    ...collectDoctorVerificationChecks(targetDir),
    ...collectDoctorHierarchicalAgentsCheck(targetDir),
    ...collectDoctorStructuralLintChecks(targetDir),
  ];

  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warn").length;

  console.log(
    JSON.stringify(
      {
        command: "doctor",
        project: basename(targetDir),
        target: targetDir,
        summary: { passed, failed, warnings, total: checks.length },
        checks,
      },
      null,
      2,
    ),
  );
}
