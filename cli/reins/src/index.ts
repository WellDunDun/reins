#!/usr/bin/env bun

import { runAudit, runAuditCommand } from "./lib/commands/audit";
import { runDoctor } from "./lib/commands/doctor";
import { runEvolve } from "./lib/commands/evolve";
import { runInit as runInitCommand } from "./lib/commands/init";

function printHelp(): void {
  const help = `reins — Harness Engineering CLI

USAGE:
  reins <command> [options]

COMMANDS:
  init <path>     Scaffold harness engineering structure in target directory
  audit <path>    Audit a project against harness engineering principles
  evolve <path>   Show evolution path to next maturity level
  doctor <path>   Check project health with prescriptive fixes
  help            Show this help message

OPTIONS:
  --name <name>   Project name (default: directory name)
  --force         Overwrite existing files
  --pack <name>   Optional automation pack (auto, agent-factory)
  --apply         Auto-run scaffolding steps during evolve
  --json          Force JSON output (default)

EXAMPLES:
  reins init .                    # Scaffold in current directory
  reins init ./my-project --name "My Project"
  reins init . --pack auto        # Adaptive pack selection by stack signals
  reins init . --pack agent-factory
  reins audit .                   # Score current project
  reins evolve .                  # Get evolution roadmap
  reins evolve . --apply          # Evolve with auto-scaffolding
  reins doctor .                  # Get prescriptive fixes

MATURITY LEVELS:
  L0: Manual          (0-4)   Traditional engineering
  L1: Assisted        (5-8)   Agents help, humans still code
  L2: Steered         (9-13)  Humans steer, agents execute
  L3: Autonomous      (14-16) Agents handle full lifecycle
  L4: Self-Correcting (17-18) System maintains itself
`;
  console.log(help);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  const hasFlag = (flag: string) => args.includes(flag);
  const getFlagValue = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  switch (command) {
    case "init": {
      const path = args[1] || ".";
      runInitCommand({
        path,
        name: getFlagValue("--name") || "",
        force: hasFlag("--force"),
        pack: getFlagValue("--pack") || "none",
      });
      break;
    }
    case "audit": {
      const path = args[1] || ".";
      runAuditCommand(path);
      break;
    }
    case "evolve": {
      const path = args[1] || ".";
      runEvolve(path, hasFlag("--apply"), { runAudit, runInit: runInitCommand });
      break;
    }
    case "doctor": {
      const path = args[1] || ".";
      runDoctor(path);
      break;
    }
    default:
      console.error(JSON.stringify({ error: `Unknown command: ${command}`, hint: "Run 'reins help'" }));
      process.exit(1);
  }
}

main();
