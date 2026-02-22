# Contributing

Thanks for your interest in improving the harness engineering toolkit.

## Getting started

```bash
git clone https://github.com/WellDunDun/harness-engineering.git
cd harness-engineering/cli/reins
bun install
```

Run the CLI locally:

```bash
bun src/index.ts audit /path/to/any/repo
```

## What to work on

**High impact areas:**

- **Audit heuristics** — improve detection accuracy for each of the six dimensions
- **New language support** — the audit currently assumes JS/TS ecosystems; Go, Rust, Python repos need attention
- **New commands** — `compare` to diff two audits over time, `watch` for continuous scoring
- **Plugin system** — let teams add custom audit dimensions

**Before starting large changes**, open an issue to discuss the approach.

## Pull requests

- Keep PRs focused — one concern per PR
- All output is deterministic JSON — new commands should follow this pattern
- Zero external dependencies is a feature, not a limitation — justify any new dependency
- Run `reins audit .` on this repo itself before submitting

## Code style

- TypeScript with strict mode
- Functions do one thing
- No magic strings — use constants
- Error messages are actionable (what happened + what to do)

## Reporting issues

Include:
- The command you ran
- The JSON output (or error)
- Your Bun version (`bun --version`)
- Your OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
