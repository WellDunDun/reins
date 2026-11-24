import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { inspectInstructions } from "./instructions";

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "reins-routing-")); });
afterEach(() => { rmSync(root, { recursive: true, force: true }); });
function file(path: string, text: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
}
function baseline(): void {
  file("AGENTS.md", "Read [Documentation router](docs/ROUTER.md).");
  file("docs/ROUTER.md", "[Architecture](../ARCHITECTURE.md)");
  file("ARCHITECTURE.md", "# Architecture");
}

describe("instruction routing", () => {
  test("accepts root and nested reference routes", () => {
    baseline();
    file("packages/core/AGENTS.md", "[Documentation router][docs]\n\n[docs]: ../../docs/ROUTER.md");
    expect(inspectInstructions(root).every((check) => check.status === "pass")).toBe(true);
  });
  test("requires a router for each nested instruction file", () => {
    baseline();
    file("packages/core/AGENTS.md", "Some package rules");
    expect(inspectInstructions(root)).toContainEqual(expect.objectContaining({ code: "instructions.router-missing", path: "packages/core/AGENTS.md", status: "fail" }));
  });
  test("reports missing architecture and broken router links", () => {
    baseline();
    file("docs/ROUTER.md", "[Architecture](../missing.md)\n[Tests](tests.md)");
    const checks = inspectInstructions(root);
    expect(checks.some((check) => check.code === "instructions.architecture-route" && check.status === "fail")).toBe(true);
    expect(checks.filter((check) => check.code === "instructions.router-link-broken")).toHaveLength(2);
    file("AGENTS.md", "[Documentation router](gone.md)");
    expect(inspectInstructions(root).some((check) => check.code === "instructions.router-broken")).toBe(true);
  });
  test("ignores example links in fences and rejects remote routers", () => {
    baseline();
    file("AGENTS.md", "```md\n[Documentation router](docs/ROUTER.md)\n```\n");
    expect(inspectInstructions(root).some((check) => check.code === "instructions.router-missing")).toBe(true);
    file("AGENTS.md", "[Documentation router](https://example.com/ROUTER.md)");
    expect(inspectInstructions(root).some((check) => check.code === "instructions.router-broken")).toBe(true);
  });
  test("accepts symlink adapters and warns about independent rules", () => {
    baseline();
    symlinkSync("AGENTS.md", join(root, "CLAUDE.md"));
    expect(inspectInstructions(root).some((check) => check.code === "instructions.adapter" && check.status === "pass")).toBe(true);
    rmSync(join(root, "CLAUDE.md"));
    file("CLAUDE.md", "Independent rules");
    expect(inspectInstructions(root).some((check) => check.code === "instructions.adapter" && check.status === "warn")).toBe(true);
  });
  test("distinguishes resolved imports and links from native loading", () => {
    baseline();
    for (const content of ["@AGENTS.md\n", "@./AGENTS.md\n", "[Shared guidance](AGENTS.md)\n"]) {
      file("CLAUDE.md", content);
      expect(inspectInstructions(root)).toContainEqual(expect.objectContaining({ code: "instructions.adapter", status: "warn" }));
    }
  });
  test("accepts a synchronized copy and warns when it drifts", () => {
    baseline();
    const canonical = readFileSync(join(root, "AGENTS.md"), "utf8");
    file("CLAUDE.md", canonical);
    expect(inspectInstructions(root)).toContainEqual(expect.objectContaining({ code: "instructions.adapter", status: "pass" }));
    file("CLAUDE.md", canonical + "\nA separate rule.");
    expect(inspectInstructions(root)).toContainEqual(expect.objectContaining({ code: "instructions.adapter", status: "warn" }));
  });
  test("rejects escaping symlinks and skips dependency trees", () => {
    baseline();
    file("node_modules/pkg/AGENTS.md", "not ours");
    file("packages/outside/AGENTS.md", "[Documentation router](../../docs/outside.md)");
    symlinkSync("/etc/hosts", join(root, "docs/outside.md"));
    const checks = inspectInstructions(root);
    expect(checks.some((check) => check.path.includes("node_modules"))).toBe(false);
    expect(checks.some((check) => check.code === "instructions.router-broken")).toBe(true);
  });
});

test("rejects absolute router paths and broken instruction symlinks", () => {
  baseline();
  file("AGENTS.md", `[Documentation router](${join(root, "docs/ROUTER.md")})`);
  expect(inspectInstructions(root).some((check) => check.code === "instructions.router-broken")).toBe(true);
  file("docs/AGENTS.md", "temporary");
  rmSync(join(root, "docs/AGENTS.md"));
  symlinkSync("missing.md", join(root, "docs/AGENTS.md"));
  expect(inspectInstructions(root).some((check) => check.code === "instructions.unreadable")).toBe(true);
});
