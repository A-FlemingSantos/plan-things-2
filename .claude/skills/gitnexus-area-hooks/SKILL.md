---
name: gitnexus-area-hooks
description: "Skill for the Hooks area of plan-things-2. 295 symbols across 66 files."
---

# Hooks

295 symbols | 66 files | Cohesion: 75%

## When to Use

- Working with code in `apps/`
- Understanding how createBoardDragCollisionState, useBoardColumns, useKanbanBoardDnd work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | useBoardColumns, addCardComment, appendCommentToCard, deleteCard, deleteChecklist (+37) |
| `apps/web/src/features/intelligence/hooks/useAiConversation.js` | dedupeThreadMessages, findMatchingLocalUserMessage, mergeMessagesPreservingStreaming, mergeMessagesWithLocalContext, mergeUniqueBlocks (+14) |
| `apps/web/src/features/workspace/hooks/useKanbanBoardDnd.js` | useKanbanBoardDnd, getDragType, handleCardDragEnd, handleDragCancel, handleDragEnd (+10) |
| `apps/web/src/shared/hooks/useCustomScrollbar.js` | applyThumbStyles, commitMetrics, computeThumbMetrics, setVisible, updateThumbLayout (+8) |
| `hooks/gitnexus-hook.cjs` | extractPattern, main, parseRgGrepPattern, pickLongestStringValue, readInput (+6) |
| `apps/web/src/features/workspace/hooks/boardCollisionDetection.js` | createBoardDragCollisionState, createBoardCollisionDetection, getCardColumnId, getColumnCollisions, getColumnsByPointerX (+5) |
| `apps/web/src/features/workspace/hooks/boardDnDUtils.js` | findColumnIdForItem, isColumnId, columnCardStackDropId, applyDragOverToColumns, findCardIndex (+5) |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFloatingPanels.js` | clearPanelTimers, openInbox, openIntelligence, openPlanner, toggleIntelligence (+5) |
| `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalAttachments.js` | handleViewportChange, openFilePicker, updateFilePickerPosition, useCardModalAttachments, pickerFiles (+4) |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardPlanner.js` | persistPlannerPinnedState, togglePlannerPinned, useKanbanBoardPlanner, formatDateLabel, plannerBaseItems (+4) |

## Entry Points

Start here when exploring this area:

- **`createBoardDragCollisionState`** (Function) — `apps/web/src/features/workspace/hooks/boardCollisionDetection.js:204`
- **`useBoardColumns`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:699`
- **`useKanbanBoardDnd`** (Function) — `apps/web/src/features/workspace/hooks/useKanbanBoardDnd.js:35`
- **`KanbanBoard`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:53`
- **`openIntelligence`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx:285`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createBoardDragCollisionState` | Function | `apps/web/src/features/workspace/hooks/boardCollisionDetection.js` | 204 |
| `useBoardColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 699 |
| `useKanbanBoardDnd` | Function | `apps/web/src/features/workspace/hooks/useKanbanBoardDnd.js` | 35 |
| `KanbanBoard` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 53 |
| `openIntelligence` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 285 |
| `BoardLoadingState` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/components/BoardLoadingState.jsx` | 0 |
| `useKanbanBoardCardActions` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardCardActions.js` | 8 |
| `useKanbanBoardFiles` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFiles.js` | 13 |
| `resizeHandler` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardToolbarMetrics.js` | 32 |
| `updateToolbarMetrics` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardToolbarMetrics.js` | 10 |
| `useKanbanBoardToolbarMetrics` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardToolbarMetrics.js` | 2 |
| `TestMemoryRouter` | Function | `apps/web/src/test/testRouter.jsx` | 7 |
| `addCardComment` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1174 |
| `deleteCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1151 |
| `deleteChecklist` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1309 |
| `deleteColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 789 |
| `updateCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1066 |
| `updateChecklistItem` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1367 |
| `updateColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 712 |
| `handleColumnDelete` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 378 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `KanbanBoard → BuildStorageKey` | cross_community | 7 |
| `RenderPlannerItem → InsertCardInOrder` | cross_community | 6 |
| `RenderPlannerItem → NormalizeTimeZone` | cross_community | 6 |
| `RenderPlannerItem → NormalizeCardDateLike` | cross_community | 6 |
| `RenderPlannerItem → UpdateColumns` | cross_community | 5 |
| `RenderPlannerItem → InsertCardInOrder` | cross_community | 5 |
| `RenderPlannerItem → FindCardInColumns` | cross_community | 4 |
| `KanbanBoard → ClearNotificationTimer` | cross_community | 4 |
| `UploadLocalFileToCard → FetchImpl` | cross_community | 4 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 25 calls |
| Contracts | 13 calls |
| Context | 13 calls |
| Icons | 6 calls |
| Workspace | 4 calls |
| AiComposerContextMenu | 3 calls |
| CardModal | 3 calls |
| Data | 2 calls |

## How to Explore

1. `context({name: "createBoardDragCollisionState"})` — see callers and callees
2. `query({search_query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
