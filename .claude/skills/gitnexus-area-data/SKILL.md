---
name: gitnexus-area-data
description: "Skill for the Data area of plan-things-2. 37 symbols across 13 files."
---

# Data

37 symbols | 13 files | Cohesion: 73%

## When to Use

- Working with code in `apps/`
- Understanding how createInitialLibrarySnapshot, createLibraryItem, getFileTypeFromName work
- Modifying data-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/files/data/libraryRepository.js` | createInitialLibrarySnapshot, createLibraryItem, getFileTypeFromName, insertLibraryItem, markLibraryItemDeleted (+3) |
| `apps/web/src/features/workspace/data/plansRepository.js` | createPlanDraftRecord, createPlanRecord, mapCover, mapMemberStyles, mapTagColor (+2) |
| `apps/web/src/features/workspace/data/recentPlansStorage.js` | buildStorageKey, readRawEntries, readRecentPlanIds, recordRecentPlan, removeRecentPlan (+1) |
| `apps/web/src/features/calendar/data/calendarRepository.js` | createCurrentMonthEvents, createInitialCalendarSnapshot, padDateNumber |
| `apps/web/src/features/workspace/data/kanbanColorPalette.js` | isKanbanAccentBaseColor, resolveKanbanAccentColor, resolveKanbanAccentForeground |
| `apps/web/src/features/workspace/data/boardTemplates.js` | createEmptyBoardColumns, createSampleBoardColumns |
| `apps/web/src/shared/contracts/planContracts.js` | normalizeBoardColumn, normalizeComment |
| `apps/web/src/features/workspace/pages/KanbanBoard/utils/kanbanBoardFileUtils.js` | mapApiFileItem |
| `apps/web/src/shared/contracts/backendAdapters.js` | buildLibraryTreeFromApi |
| `apps/web/src/shared/contracts/fileContracts.js` | normalizeLibraryItem |

## Entry Points

Start here when exploring this area:

- **`createInitialLibrarySnapshot`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:97`
- **`createLibraryItem`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:30`
- **`getFileTypeFromName`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:12`
- **`insertLibraryItem`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:166`
- **`markLibraryItemDeleted`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:181`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createInitialLibrarySnapshot` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 97 |
| `createLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 30 |
| `getFileTypeFromName` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 12 |
| `insertLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 166 |
| `markLibraryItemDeleted` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 181 |
| `restoreItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 135 |
| `restoreLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 134 |
| `updateLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 122 |
| `mapApiFileItem` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/utils/kanbanBoardFileUtils.js` | 2 |
| `buildLibraryTreeFromApi` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 655 |
| `normalizeLibraryItem` | Function | `apps/web/src/shared/contracts/fileContracts.js` | 2 |
| `createEmptyBoardColumns` | Function | `apps/web/src/features/workspace/data/boardTemplates.js` | 2 |
| `createPlanDraftRecord` | Function | `apps/web/src/features/workspace/data/plansRepository.js` | 126 |
| `readRecentPlanIds` | Function | `apps/web/src/features/workspace/data/recentPlansStorage.js` | 40 |
| `recordRecentPlan` | Function | `apps/web/src/features/workspace/data/recentPlansStorage.js` | 44 |
| `removeRecentPlan` | Function | `apps/web/src/features/workspace/data/recentPlansStorage.js` | 55 |
| `createSampleBoardColumns` | Function | `apps/web/src/features/workspace/data/boardTemplates.js` | 6 |
| `createInitialPlansSnapshot` | Function | `apps/web/src/features/workspace/data/plansRepository.js` | 118 |
| `createClientId` | Function | `apps/web/src/shared/utils/createClientId.js` | 0 |
| `createInitialCalendarSnapshot` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 42 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `KanbanBoard → BuildStorageKey` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 1 calls |
| Contracts | 1 calls |

## How to Explore

1. `context({name: "createInitialLibrarySnapshot"})` — see callers and callees
2. `query({search_query: "data"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
