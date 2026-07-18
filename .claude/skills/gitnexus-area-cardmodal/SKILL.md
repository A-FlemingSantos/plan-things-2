---
name: gitnexus-area-cardmodal
description: "Skill for the CardModal area of plan-things-2. 40 symbols across 11 files."
---

# CardModal

40 symbols | 11 files | Cohesion: 71%

## When to Use

- Working with code in `apps/`
- Understanding how CardModal, cancelTitleEdit, getMemberName work
- Modifying cardmodal-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | CardModal, cancelTitleEdit, getMemberName, handleMoveToNextColumn, handleToggleCardCompleted (+16) |
| `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalActivity.js` | getCommentPresenter, addComment, appendActivityEvent |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | buildInitialCardSchedule, extractDayFromDisplayLabel, formatDueDateLabelFromValue |
| `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | formatCalendarDateToBrazil, isSameCalendarDate, resolveCardScheduleFromRange |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | CardModalChecklistAssignMenu, CardModalChecklistCreateMenu |
| `apps/web/src/features/workspace/components/CardModal/utils/activityUtils.js` | buildInitials, buildInlineAssignmentText |
| `apps/web/src/features/workspace/components/CardModal/CardModal.test.jsx` | onUpdate, onDelete |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalActivitySidebar.jsx` | CardModalActivitySidebar |
| `apps/web/src/features/workspace/components/CardModal/components/PropertyDatesSummary.jsx` | PropertyDatesSummary |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalCommon.js` | createCardModalUid |

## Entry Points

Start here when exploring this area:

- **`CardModal`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:53`
- **`cancelTitleEdit`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:397`
- **`getMemberName`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:142`
- **`handleMoveToNextColumn`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:345`
- **`handleToggleCardCompleted`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:358`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CardModal` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 53 |
| `cancelTitleEdit` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 397 |
| `getMemberName` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 142 |
| `handleMoveToNextColumn` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 345 |
| `handleToggleCardCompleted` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 358 |
| `updatePosition` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 824 |
| `CardModalActivitySidebar` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalActivitySidebar.jsx` | 17 |
| `CardModalChecklistAssignMenu` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | 67 |
| `CardModalChecklistCreateMenu` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklistMenus.jsx` | 12 |
| `PropertyDatesSummary` | Function | `apps/web/src/features/workspace/components/CardModal/components/PropertyDatesSummary.jsx` | 2 |
| `getCommentPresenter` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalActivity.js` | 124 |
| `buildInitials` | Function | `apps/web/src/features/workspace/components/CardModal/utils/activityUtils.js` | 17 |
| `applyPersistedCard` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 272 |
| `buildNextCard` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 235 |
| `handleLabelSelect` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 600 |
| `hasOverride` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 236 |
| `persistCardChanges` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 309 |
| `saveDescription` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 403 |
| `saveTitle` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 369 |
| `buildInitialCardSchedule` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 94 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CardModal → NormalizeChecklist` | cross_community | 4 |
| `CardModal → ParseBrazilDateValue` | cross_community | 4 |
| `CardModal → ComputeFilePickerPosition` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Hooks | 5 calls |
| KanbanColumnStatusPicker | 3 calls |
| Calendar | 2 calls |
| Components | 2 calls |

## How to Explore

1. `context({name: "CardModal"})` — see callers and callees
2. `query({search_query: "cardmodal"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
