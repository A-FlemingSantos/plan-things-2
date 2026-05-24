<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **plan-things-2** (7403 symbols, 16515 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

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
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Files area (227 symbols) | `.claude/skills/generated/files/SKILL.md` |
| Work in the Auth area (172 symbols) | `.claude/skills/generated/auth/SKILL.md` |
| Work in the Settings area (155 symbols) | `.claude/skills/generated/settings/SKILL.md` |
| Work in the Board area (150 symbols) | `.claude/skills/generated/board/SKILL.md` |
| Work in the Api area (130 symbols) | `.claude/skills/generated/api/SKILL.md` |
| Work in the Context area (115 symbols) | `.claude/skills/generated/context/SKILL.md` |
| Work in the Screens area (103 symbols) | `.claude/skills/generated/screens/SKILL.md` |
| Work in the KanbanBoard area (91 symbols) | `.claude/skills/generated/kanbanboard/SKILL.md` |
| Work in the Providers area (85 symbols) | `.claude/skills/generated/providers/SKILL.md` |
| Work in the Plans area (68 symbols) | `.claude/skills/generated/plans/SKILL.md` |
| Work in the SettingsPage area (64 symbols) | `.claude/skills/generated/settingspage/SKILL.md` |
| Work in the Workspace area (64 symbols) | `.claude/skills/generated/workspace/SKILL.md` |
| Work in the CalendarPage area (62 symbols) | `.claude/skills/generated/calendarpage/SKILL.md` |
| Work in the Contracts area (55 symbols) | `.claude/skills/generated/contracts/SKILL.md` |
| Work in the CardModal area (50 symbols) | `.claude/skills/generated/cardmodal/SKILL.md` |
| Work in the Hooks area (46 symbols) | `.claude/skills/generated/hooks/SKILL.md` |
| Work in the Calendar area (37 symbols) | `.claude/skills/generated/calendar/SKILL.md` |
| Work in the Data area (33 symbols) | `.claude/skills/generated/data/SKILL.md` |
| Work in the Components area (22 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Avatar area (20 symbols) | `.claude/skills/generated/avatar/SKILL.md` |

<!-- gitnexus:end -->
