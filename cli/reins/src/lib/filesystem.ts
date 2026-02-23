import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".expo"]);

export function safeReadDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function safeStat(path: string): ReturnType<typeof statSync> | null {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function collectFileMatch(
  current: string,
  entry: string,
  depth: number,
  maxDepth: number,
  pattern: RegExp,
  results: string[],
  walk: (next: string, nextDepth: number) => void,
): void {
  if (IGNORED_DIRS.has(entry)) return;

  const fullPath = join(current, entry);
  const stat = safeStat(fullPath);
  if (!stat) return;

  if (stat.isDirectory()) {
    walk(fullPath, depth + 1);
    return;
  }

  if (depth <= maxDepth && pattern.test(entry)) {
    results.push(fullPath);
  }
}

export function findFiles(dir: string, pattern: RegExp, maxDepth = 3): string[] {
  const results: string[] = [];

  function walk(current: string, depth: number): void {
    if (depth > maxDepth) return;

    for (const entry of safeReadDir(current)) {
      collectFileMatch(current, entry, depth, maxDepth, pattern, results, walk);
    }
  }

  walk(dir, 0);
  return results;
}
