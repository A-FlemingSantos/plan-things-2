<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **plan-things-2** (7221 symbols, 19993 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/plan-things-2/context` | Codebase overview, check index freshness |
| `gitnexus://repo/plan-things-2/clusters` | All functional areas |
| `gitnexus://repo/plan-things-2/processes` | All execution flows |
| `gitnexus://repo/plan-things-2/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |
| Work in the Settings area (430 symbols) | `.claude/skills/gitnexus-area-settings/SKILL.md` |
| Work in the Hooks area (344 symbols) | `.claude/skills/gitnexus-area-hooks/SKILL.md` |
| Work in the Github area (234 symbols) | `.claude/skills/gitnexus-area-github/SKILL.md` |
| Work in the Api area (179 symbols) | `.claude/skills/gitnexus-area-api/SKILL.md` |
| Work in the Auth area (167 symbols) | `.claude/skills/gitnexus-area-auth/SKILL.md` |
| Work in the Board area (155 symbols) | `.claude/skills/gitnexus-area-board/SKILL.md` |
| Work in the Context area (132 symbols) | `.claude/skills/gitnexus-area-context/SKILL.md` |
| Work in the Screens area (114 symbols) | `.claude/skills/gitnexus-area-screens/SKILL.md` |
| Work in the Persistence area (108 symbols) | `.claude/skills/gitnexus-area-persistence/SKILL.md` |
| Work in the Components area (103 symbols) | `.claude/skills/gitnexus-area-components/SKILL.md` |
| Work in the Intelligence area (94 symbols) | `.claude/skills/gitnexus-area-intelligence/SKILL.md` |
| Work in the Providers area (88 symbols) | `.claude/skills/gitnexus-area-providers/SKILL.md` |
| Work in the SettingsPage area (79 symbols) | `.claude/skills/gitnexus-area-settingspage/SKILL.md` |
| Work in the Plans area (70 symbols) | `.claude/skills/gitnexus-area-plans/SKILL.md` |
| Work in the Calendar area (55 symbols) | `.claude/skills/gitnexus-area-calendar/SKILL.md` |
| Work in the Contracts area (52 symbols) | `.claude/skills/gitnexus-area-contracts/SKILL.md` |
| Work in the Files area (50 symbols) | `.claude/skills/gitnexus-area-files/SKILL.md` |
| Work in the Tools area (45 symbols) | `.claude/skills/gitnexus-area-tools/SKILL.md` |
| Work in the CardModal area (39 symbols) | `.claude/skills/gitnexus-area-cardmodal/SKILL.md` |
| Work in the DateTime area (37 symbols) | `.claude/skills/gitnexus-area-datetime/SKILL.md` |

<!-- gitnexus:end -->
