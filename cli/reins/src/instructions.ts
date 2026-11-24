import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "fs";
import { dirname, isAbsolute, relative, resolve } from "path";

export interface InstructionCheck {
  code: string;
  path: string;
  status: "pass" | "fail" | "warn";
  message: string;
  fix: string;
}

// Inspect links without executing commands or following links outside the repository.
function links(markdown: string): Array<{ label: string; target: string }> {
  const text = markdown.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
  const result = [...text.matchAll(/(?<!!)\[([^\]]+)\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)]
    .map((match) => ({ label: match[1] ?? "", target: match[2] ?? "" }));
  const references = new Map([...text.matchAll(/^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)]
    .map((match) => [(match[1] ?? "").toLowerCase(), match[2] ?? ""]));
  for (const match of text.matchAll(/(?<!!)\[([^\]]+)\]\[([^\]]*)\]/g)) {
    const label = match[1] ?? "";
    const target = references.get((match[2] || label).toLowerCase());
    if (target) result.push({ label, target });
  }
  return result;
}

function localFile(root: string, source: string, target: string): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || target.startsWith("//")) return;
  let decoded: string;
  try { decoded = decodeURIComponent(target.split(/[?#]/)[0] ?? ""); } catch { return; }
  if (isAbsolute(decoded)) return;
  const path = resolve(dirname(source), decoded);
  if (!existsSync(path)) return;
  const actual = realpathSync(path);
  const rel = relative(root, actual);
  if (rel === ".." || rel.startsWith("../") || isAbsolute(rel) || !statSync(actual).isFile()) return;
  return actual;
}

export function inspectInstructions(target: string): InstructionCheck[] {
  const root = realpathSync(resolve(target));
  const checks: InstructionCheck[] = [];
  const ignored = new Set([".git", "node_modules", "vendor", "dist", "build", ".next", ".venv", "venv", ".context", ".repos", ".factory", ".agents"]);
  const agents: string[] = [];
  const adapters: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name) && !(entry.name === "worktrees" && dir.endsWith("/.claude"))) walk(path);
      if (entry.name === "AGENTS.md") agents.push(path);
      if (entry.name === "CLAUDE.md") adapters.push(path);
    }
  }
  walk(root);
  if (!agents.includes(resolve(root, "AGENTS.md"))) checks.push({ code: "instructions.root-missing", path: "AGENTS.md", status: "fail", message: "Root AGENTS.md is missing.", fix: "Create a concise root contract linking to [Documentation router](docs/ROUTER.md)." });
  for (const path of agents) {
    const rel = relative(root, path);
    const safe = localFile(root, path, "./AGENTS.md");
    if (!safe) {
      checks.push({ code: "instructions.unreadable", path: rel, status: "fail", message: "Instruction file is broken or resolves outside the repository.", fix: "Use a repository-local instruction file." });
      continue;
    }
    const content = readFileSync(safe, "utf8");
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    if (words > 1000) checks.push({ code: "instructions.budget", path: rel, status: "warn", message: `${words} words in always-loaded guidance.`, fix: "Review for duplication; move task-specific detail behind router links. This budget is a review heuristic, not a research-proven limit." });
    const routes = links(content).filter((link) => /documentation router/i.test(link.label) || /(?:^|\/)ROUTER\.md(?:#.*)?$/.test(link.target));
    if (!routes.length) {
      checks.push({ code: "instructions.router-missing", path: rel, status: "fail", message: "AGENTS.md has no explicit documentation-router link.", fix: "Add [Documentation router](relative/path/to/docs/ROUTER.md). Nested files must also link to the router." });
      continue;
    }
    for (const route of routes) {
      const router = localFile(root, path, route.target);
      if (!router) {
        checks.push({ code: "instructions.router-broken", path: rel, status: "fail", message: `Router target is missing, external, or not a file: ${route.target}`, fix: "Link to an existing repository-local router file." });
        continue;
      }
      const routerLinks = links(readFileSync(router, "utf8"));
      const architecture = routerLinks.some((link) => {
        const file = localFile(root, router, link.target);
        return file !== undefined && /(?:^|\/)ARCHITECTURE\.md$/.test(file);
      });
      checks.push({ code: "instructions.architecture-route", path: rel, status: architecture ? "pass" : "fail", message: architecture ? "Router links to an existing ARCHITECTURE.md." : "Router has no valid local ARCHITECTURE.md link.", fix: architecture ? "" : "Add a relative link to the project's ARCHITECTURE.md in the router." });
      for (const link of routerLinks) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(link.target) || link.target.startsWith("#") || link.target.startsWith("//")) continue;
        if (!localFile(root, router, link.target)) checks.push({ code: "instructions.router-link-broken", path: relative(root, router), status: "fail", message: `Missing or unsupported local router target: ${link.target}`, fix: "Repair the link, or remove routes for documents that do not exist. Link to files, not directories." });
      }
    }
  }
  for (const path of adapters) {
    const safe = localFile(root, path, "./CLAUDE.md");
    if (!safe) {
      checks.push({ code: "instructions.adapter-broken", path: relative(root, path), status: "fail", message: "CLAUDE.md is broken or resolves outside the repository.", fix: "Use a local adapter pointing to AGENTS.md." });
      continue;
    }
    const canonical = localFile(root, path, "./AGENTS.md");
    const content = readFileSync(safe, "utf8");
    const imported = [...content.matchAll(/^\s*@([^\s]+)\s*$/gm)].some((match) => {
      const file = localFile(root, path, match[1] ?? "");
      return file !== undefined && /(?:^|\/)AGENTS\.md$/.test(file);
    });
    const linked = links(content).some((link) => {
      const file = localFile(root, path, link.target);
      return file !== undefined && /(?:^|\/)AGENTS\.md$/.test(file);
    });
    const alias = canonical !== undefined && safe === canonical;
    const copy = canonical !== undefined && content === readFileSync(canonical, "utf8");
    const synchronized = alias || copy;
    const message = alias
      ? "CLAUDE.md resolves to the canonical AGENTS.md file."
      : copy
        ? "CLAUDE.md exactly matches AGENTS.md; keep the copy synchronized."
        : imported
          ? "CLAUDE.md imports AGENTS.md; local resolution does not prove native delivery from nested working directories."
          : linked
            ? "CLAUDE.md links to AGENTS.md; a Markdown link does not establish automatic instruction loading."
            : "CLAUDE.md has no validated alias or matching copy of AGENTS.md; shared rules may drift.";
    checks.push({ code: "instructions.adapter", path: relative(root, path), status: synchronized ? "pass" : "warn", message, fix: synchronized ? "" : "Use a supported local symlink or synchronized generated copy, or verify native loading for the exact agent version and working directories. Retain only necessary Claude-specific additions." });
  }
  return checks.filter((check, index, all) => all.findIndex((other) => other.code === check.code && other.path === check.path && other.message === check.message) === index);
}
