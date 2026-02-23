import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { ResolvedAutomationPack } from "../automation-pack";
import {
  type AutomationPack,
  normalizeAutomationPack,
  resolveAutomationPack,
  scaffoldAutomationPack,
} from "../automation-pack";
import {
  agentsMdTemplate,
  architectureMdTemplate,
  coreBeliefsTemplate,
  designDocsIndexTemplate,
  goldenPrinciplesTemplate,
  productSpecsIndexTemplate,
  riskPolicyTemplate,
  techDebtTrackerTemplate,
} from "../templates";
import type { InitOptions } from "../types";

interface InitContext {
  targetDir: string;
  projectName: string;
  requestedPack: AutomationPack;
}

function parseRequestedPack(rawPack: string): AutomationPack {
  const requestedPack = normalizeAutomationPack(rawPack || "none");
  if (requestedPack) return requestedPack;

  console.error(
    JSON.stringify({
      error: `Unknown automation pack: ${rawPack}`,
      allowed: ["none", "auto", "agent-factory"],
      hint: "Use '--pack auto' for adaptive selection or '--pack agent-factory' for explicit scaffolding.",
    }),
  );
  process.exit(1);
}

function ensureInitTarget(targetDir: string, force: boolean): void {
  if (!existsSync(targetDir)) {
    console.error(JSON.stringify({ error: `Directory does not exist: ${targetDir}` }));
    process.exit(1);
  }

  const agentsMdPath = join(targetDir, "AGENTS.md");
  if (!existsSync(agentsMdPath) || force) return;

  console.error(
    JSON.stringify({
      error: "AGENTS.md already exists. Use --force to overwrite.",
      hint: "Run 'reins audit' to assess your current setup instead.",
    }),
  );
  process.exit(1);
}

function createBaseDirectories(targetDir: string, created: string[]): void {
  const dirs = [
    "docs/design-docs",
    "docs/exec-plans/active",
    "docs/exec-plans/completed",
    "docs/generated",
    "docs/product-specs",
    "docs/references",
  ];

  for (const dir of dirs) {
    const fullPath = join(targetDir, dir);
    if (existsSync(fullPath)) continue;

    mkdirSync(fullPath, { recursive: true });
    created.push(`${dir}/`);
  }
}

function createBaseFiles(
  targetDir: string,
  projectName: string,
  selectedPack: ResolvedAutomationPack,
  force: boolean,
  created: string[],
): void {
  const files: Array<{ path: string; content: string }> = [
    { path: "AGENTS.md", content: agentsMdTemplate(projectName) },
    { path: "ARCHITECTURE.md", content: architectureMdTemplate(projectName) },
    { path: "risk-policy.json", content: riskPolicyTemplate(selectedPack) },
    { path: "docs/golden-principles.md", content: goldenPrinciplesTemplate() },
    { path: "docs/design-docs/index.md", content: designDocsIndexTemplate() },
    { path: "docs/design-docs/core-beliefs.md", content: coreBeliefsTemplate() },
    { path: "docs/product-specs/index.md", content: productSpecsIndexTemplate() },
    { path: "docs/exec-plans/tech-debt-tracker.md", content: techDebtTrackerTemplate() },
  ];

  for (const file of files) {
    const fullPath = join(targetDir, file.path);
    if (existsSync(fullPath) && !force) continue;

    writeFileSync(fullPath, file.content);
    created.push(file.path);
  }
}

function buildNextSteps(
  selectedPack: ResolvedAutomationPack,
  requestedPack: AutomationPack,
  packReason: string,
): string[] {
  const steps = [
    "Edit AGENTS.md — fill in the project description",
    "Edit ARCHITECTURE.md — define your business domains",
    "Review risk-policy.json — set tiers and docs drift rules for your repo",
    "Edit docs/golden-principles.md — customize rules for your project",
    "Run 'reins audit .' to see your starting score",
  ];

  if (selectedPack === "agent-factory") {
    steps.push(
      "Review generated scripts in scripts/ and tune checks for your stack and taste",
      "Enable or adapt new workflows in .github/workflows/ to match your branch protections",
      "Run 'node scripts/lint-structure.mjs' locally to baseline structural checks",
    );
    return steps;
  }

  if (requestedPack === "auto") {
    steps.push(`Auto-pack selection: ${packReason}`);
  }

  return steps;
}

function buildInitContext(options: InitOptions): InitContext {
  const targetDir = resolve(options.path);
  return {
    targetDir,
    projectName: options.name || basename(targetDir),
    requestedPack: parseRequestedPack(options.pack || "none"),
  };
}

export function runInit(options: InitOptions): void {
  const { targetDir, projectName, requestedPack } = buildInitContext(options);
  ensureInitTarget(targetDir, options.force);

  const packResolution = resolveAutomationPack(targetDir, requestedPack);
  const selectedPack = packResolution.selected;
  const created: string[] = [];

  createBaseDirectories(targetDir, created);
  createBaseFiles(targetDir, projectName, selectedPack, options.force, created);
  created.push(...scaffoldAutomationPack(targetDir, selectedPack, options.force));

  console.log(
    JSON.stringify(
      {
        command: "init",
        project: projectName,
        target: targetDir,
        requested_automation_pack: requestedPack === "none" ? null : requestedPack,
        automation_pack: selectedPack === "none" ? null : selectedPack,
        automation_pack_reason: packResolution.reason,
        created,
        next_steps: buildNextSteps(selectedPack, requestedPack, packResolution.reason),
      },
      null,
      2,
    ),
  );
}
