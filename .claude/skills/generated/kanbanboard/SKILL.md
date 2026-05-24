---
name: kanbanboard
description: "Skill for the KanbanBoard area of plan-things-2. 91 symbols across 4 files."
---

# KanbanBoard

91 symbols | 4 files | Cohesion: 76%

## When to Use

- Working with code in `apps/`
- Understanding how deleteColumn, deleteCard, handleDrop work
- Modifying kanbanboard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | onMoveError, handleCardDelete, showNotification, handleColumnDelete, openInviteModal (+71) |
| `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js` | compareNullableStrings, diffDaysFromDateKeys, filterPlannerItems, sortPlannerItems, plannedBucketForDiffDays (+1) |
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | removeCardFromColumns, removeColumnFromColumns, deleteColumn, deleteCard, useBoardColumns |
| `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | moveCardInColumns, handleDrop, handleDragEnd, useBoardDragAndDrop |

## Entry Points

Start here when exploring this area:

- **`deleteColumn`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:591`
- **`deleteCard`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:876`
- **`handleDrop`** (Function) — `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js:60`
- **`handleDragEnd`** (Function) — `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js:97`
- **`onMoveError`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:899`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `deleteColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 591 |
| `deleteCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 876 |
| `handleDrop` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 60 |
| `handleDragEnd` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 97 |
| `onMoveError` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 899 |
| `handleCardDelete` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 965 |
| `showNotification` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1002 |
| `handleColumnDelete` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1013 |
| `openInviteModal` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1047 |
| `reloadFileLists` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1148 |
| `findBoardCard` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1859 |
| `clearInboxDeliveries` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1894 |
| `handleInboxDrop` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1957 |
| `useBoardColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 509 |
| `useBoardDragAndDrop` | Function | `apps/web/src/features/workspace/hooks/useBoardDragAndDrop.js` | 41 |
| `KanbanBoard` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 534 |
| `refreshMembersMenuPosition` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 646 |
| `handleResize` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 687 |
| `updateToolbarMetrics` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 700 |
| `resizeHandler` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 722 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 11 calls |
| Hooks | 9 calls |
| Context | 5 calls |
| Data | 4 calls |
| Workspace | 2 calls |
| Auth | 1 calls |
| CalendarPage | 1 calls |

## How to Explore

1. `gitnexus_context({name: "deleteColumn"})` — see callers and callees
2. `gitnexus_query({query: "kanbanboard"})` — find related execution flows
3. Read key files listed above for implementation details
