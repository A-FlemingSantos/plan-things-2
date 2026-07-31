---
name: gitnexus-area-hooks
description: "Skill for the Hooks area of plan-things-2. 284 symbols across 56 files."
---

# Hooks

284 symbols | 56 files | Cohesion: 79%

## When to Use

- Working with code in `apps/`
- Understanding how addCardComment, deleteCard, deleteChecklist work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | addCardComment, appendCommentToCard, deleteCard, deleteChecklist, deleteColumn (+36) |
| `apps/web/src/features/intelligence/hooks/useAiConversation.js` | dedupeThreadMessages, findMatchingLocalUserMessage, mergeMessagesPreservingStreaming, mergeMessagesWithLocalContext, mergeUniqueBlocks (+14) |
| `apps/web/src/features/workspace/hooks/useKanbanBoardDnd.js` | getDragType, handleCardDragEnd, handleDragCancel, handleDragEnd, handleDragStart (+9) |
| `apps/web/src/shared/hooks/useCustomScrollbar.js` | applyThumbStyles, commitMetrics, computeThumbMetrics, handlePointerUp, setVisible (+8) |
| `apps/web/src/features/workspace/components/CardModal/utils/activityUtils.js` | buildInlineAssignmentText, buildActivitySidebarStorageKey, buildInitialActivitySnapshot, buildSidebarPanelStorageKey, formatCardCreatedLabel (+7) |
| `hooks/gitnexus-hook.cjs` | extractPattern, main, parseRgGrepPattern, pickLongestStringValue, readInput (+6) |
| `apps/web/src/features/workspace/hooks/boardDnDUtils.js` | findColumnIdForItem, isColumnId, columnCardStackDropId, applyDragOverToColumns, findCardIndex (+5) |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFloatingPanels.js` | clearPanelTimers, openInbox, openIntelligence, openPlanner, toggleIntelligence (+5) |
| `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalActivity.js` | addComment, appendActivityEvent, activitySidebarStorageKey, sidebarPanelStorageKey, useCardModalActivity (+4) |
| `apps/web/src/features/workspace/hooks/boardCollisionDetection.js` | createBoardCollisionDetection, getCardColumnId, getColumnCollisions, getColumnsByPointerX, getContainerType (+4) |

## Entry Points

Start here when exploring this area:

- **`addCardComment`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:1174`
- **`deleteCard`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:1151`
- **`deleteChecklist`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:1309`
- **`deleteColumn`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:789`
- **`updateCard`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:1066`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `addCardComment` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1174 |
| `deleteCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1151 |
| `deleteChecklist` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1309 |
| `deleteColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 789 |
| `updateCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1066 |
| `updateChecklistItem` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1367 |
| `updateColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 712 |
| `handleColumnDelete` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 364 |
| `closeChecklistComposer` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 78 |
| `handleChecklistCreate` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 83 |
| `handleChecklistDelete` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 123 |
| `resetChecklistItemDraft` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 65 |
| `updatePosition` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 409 |
| `useCardModalChecklist` | Function | `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalChecklist.js` | 13 |
| `buildCalendarBaseDate` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 35 |
| `buildCalendarDays` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 50 |
| `parseBrazilDateValue` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 18 |
| `buildInitialChecklist` | Function | `apps/web/src/features/workspace/components/CardModal/utils/checklistUtils.js` | 29 |
| `normalizeChecklist` | Function | `apps/web/src/features/workspace/components/CardModal/utils/checklistUtils.js` | 17 |
| `findColumnIdForItem` | Function | `apps/web/src/features/workspace/hooks/boardDnDUtils.js` | 12 |

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
| `UploadLocalFileToCard → FetchImpl` | cross_community | 4 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |
| `UploadLocalFileToCard → ApiClientError` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 25 calls |
| Contracts | 13 calls |
| IntelligenceChat | 3 calls |
| AiComposerContextMenu | 3 calls |
| Data | 2 calls |
| Context | 2 calls |
| Cluster_330 | 1 calls |
| AppThemeScope | 1 calls |

## How to Explore

1. `context({name: "addCardComment"})` — see callers and callees
2. `query({search_query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
