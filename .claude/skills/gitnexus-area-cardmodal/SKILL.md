---
name: gitnexus-area-cardmodal
description: "Skill for the CardModal area of plan-things-2. 39 symbols across 11 files."
---

# CardModal

39 symbols | 11 files | Cohesion: 67%

## When to Use

- Working with code in `apps/`
- Understanding how Check, CardModal, cancelTitleEdit work
- Modifying cardmodal-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | CardModal, cancelTitleEdit, getMemberName, handleMoveToNextColumn, handleToggleCardCompleted (+16) |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | formatCalendarInputValue, formatCalendarMonthLabel, buildInitialCardSchedule, extractDayFromDisplayLabel |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | CardModalChecklistAssignMenu, CardModalChecklistCreateMenu, CardModalChecklistDueMenu |
| `apps/web/src/features/workspace/components/CardModal/CardModal.test.jsx` | onUpdate, onDelete |
| `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalActivity.js` | addComment, appendActivityEvent |
| `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | buildBrazilDateRange, parseBrazilDateToCalendarDate |
| `apps/web/src/features/settings/components/settingsIcons.jsx` | Check |
| `apps/web/src/features/workspace/components/CardModal/components/PropertyDatesSummary.jsx` | PropertyDatesSummary |
| `apps/web/src/features/workspace/components/CardModal/utils/activityUtils.js` | buildInlineAssignmentText |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalCommon.js` | createCardModalUid |

## Entry Points

Start here when exploring this area:

- **`Check`** (Function) — `apps/web/src/features/settings/components/settingsIcons.jsx:1`
- **`CardModal`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:54`
- **`cancelTitleEdit`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:417`
- **`getMemberName`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:150`
- **`handleMoveToNextColumn`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:365`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `Check` | Function | `apps/web/src/features/settings/components/settingsIcons.jsx` | 1 |
| `CardModal` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 54 |
| `cancelTitleEdit` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 417 |
| `getMemberName` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 150 |
| `handleMoveToNextColumn` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 365 |
| `handleToggleCardCompleted` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 378 |
| `updatePosition` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 824 |
| `CardModalChecklistAssignMenu` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | 67 |
| `CardModalChecklistCreateMenu` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | 12 |
| `CardModalChecklistDueMenu` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | 123 |
| `PropertyDatesSummary` | Function | `apps/web/src/features/workspace/components/CardModal/components/PropertyDatesSummary.jsx` | 2 |
| `formatCalendarInputValue` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 46 |
| `formatCalendarMonthLabel` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 72 |
| `applyPersistedCard` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 292 |
| `buildNextCard` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 255 |
| `handleLabelSelect` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 624 |
| `hasOverride` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 256 |
| `persistCardChanges` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 329 |
| `saveDescription` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 423 |
| `saveTitle` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 389 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CardModal → NormalizeChecklist` | cross_community | 4 |
| `CardModal → ParseBrazilDateValue` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 5 calls |
| Hooks | 5 calls |
| Calendar | 2 calls |
| Github | 1 calls |

## How to Explore

1. `context({name: "Check"})` — see callers and callees
2. `query({search_query: "cardmodal"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
