---
name: kanbanboard
description: "Skill for the KanbanBoard area of plan-things-2. 95 symbols across 4 files."
---

# KanbanBoard

95 symbols | 4 files | Cohesion: 76%

## When to Use

- Working with code in `apps/`
- Understanding how useBoardColumns, useBoardDragAndDrop, KanbanBoard work
- Modifying kanbanboard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | describeInviteError, formatInviteStatus, KanbanBoard, refreshMembersMenuPosition, handleResize (+75) |
| `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js` | compareNullableStrings, diffDaysFromDateKeys, filterPlannerItems, sortPlannerItems, plannedBucketForDiffDays (+1) |
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | useBoardColumns, removeCardFromColumns, removeColumnFromColumns, deleteColumn, deleteCard |
| `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | useBoardDragAndDrop, moveCardInColumns, handleDrop, handleDragEnd |

## Entry Points

Start here when exploring this area:

- **`useBoardColumns`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:509`
- **`useBoardDragAndDrop`** (Function) — `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js:41`
- **`KanbanBoard`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:534`
- **`refreshMembersMenuPosition`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:646`
- **`handleResize`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:687`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useBoardColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 509 |
| `useBoardDragAndDrop` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 41 |
| `KanbanBoard` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 534 |
| `refreshMembersMenuPosition` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 646 |
| `handleResize` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 687 |
| `updateToolbarMetrics` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 700 |
| `resizeHandler` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 722 |
| `loadPlanInvites` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 831 |
| `toggleMembersPanel` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1027 |
| `submitInvite` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1085 |
| `revokePlanInvite` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1113 |
| `openInbox` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1307 |
| `toggleInboxRecipient` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1983 |
| `renderInboxPanel` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 2029 |
| `renderPlannerPanel` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 2159 |
| `deleteColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 591 |
| `deleteCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 876 |
| `handleDrop` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 60 |
| `handleDragEnd` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 97 |
| `onMoveError` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 899 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 12 calls |
| Hooks | 9 calls |
| Context | 5 calls |
| Data | 4 calls |
| Workspace | 2 calls |
| Auth | 1 calls |
| CalendarPage | 1 calls |

## How to Explore

1. `gitnexus_context({name: "useBoardColumns"})` — see callers and callees
2. `gitnexus_query({query: "kanbanboard"})` — find related execution flows
3. Read key files listed above for implementation details
