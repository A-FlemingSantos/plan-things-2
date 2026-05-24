---
name: data
description: "Skill for the Data area of plan-things-2. 33 symbols across 12 files."
---

# Data

33 symbols | 12 files | Cohesion: 68%

## When to Use

- Working with code in `apps/`
- Understanding how getFileTypeFromName, createLibraryItem, createInitialLibrarySnapshot work
- Modifying data-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/files/data/libraryRepository.js` | getFileTypeFromName, createLibraryItem, createInitialLibrarySnapshot, updateLibraryItem, restoreLibraryItem (+3) |
| `apps/web/src/features/workspace/data/plansRepository.js` | mapTagColor, mapTagLabel, mapMemberStyles, mapCover, createPlanRecord (+2) |
| `apps/web/src/features/calendar/data/calendarRepository.js` | padDateNumber, createCurrentMonthEvents, createInitialCalendarSnapshot |
| `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | enrichGeneratedCardKinds, useCalendarEvents, loadEvents |
| `apps/web/src/features/workspace/data/boardTemplates.js` | createEmptyBoardColumns, createSampleBoardColumns |
| `apps/web/src/shared/contracts/planContracts.js` | normalizeComment, normalizeBoardColumn |
| `apps/web/src/features/workspace/data/kanbanColorPalette.js` | resolveKanbanAccentColor, resolveKanbanAccentForeground |
| `apps/web/src/shared/components/WorkspaceHeader/WorkspaceHeader.jsx` | WorkspaceHeader, openSettingsSection |
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | mapApiFileItem |
| `apps/web/src/shared/contracts/backendAdapters.js` | foldersAndFiles |

## Entry Points

Start here when exploring this area:

- **`getFileTypeFromName`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:12`
- **`createLibraryItem`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:30`
- **`createInitialLibrarySnapshot`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:97`
- **`updateLibraryItem`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:122`
- **`restoreLibraryItem`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:134`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getFileTypeFromName` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 12 |
| `createLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 30 |
| `createInitialLibrarySnapshot` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 97 |
| `updateLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 122 |
| `restoreLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 134 |
| `restoreItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 135 |
| `insertLibraryItem` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 166 |
| `markLibraryItemDeleted` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 181 |
| `foldersAndFiles` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 639 |
| `normalizeLibraryItem` | Function | `apps/web/src/shared/contracts/fileContracts.js` | 2 |
| `createEmptyBoardColumns` | Function | `apps/web/src/features/workspace/data/boardTemplates.js` | 2 |
| `createPlanDraftRecord` | Function | `apps/web/src/features/workspace/data/plansRepository.js` | 126 |
| `createInitialCalendarSnapshot` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 42 |
| `useCalendarEvents` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 81 |
| `loadEvents` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 105 |
| `createSampleBoardColumns` | Function | `apps/web/src/features/workspace/data/boardTemplates.js` | 6 |
| `createInitialPlansSnapshot` | Function | `apps/web/src/features/workspace/data/plansRepository.js` | 118 |
| `createClientId` | Function | `apps/web/src/shared/utils/createClientId.js` | 0 |
| `resolveKanbanAccentColor` | Function | `apps/web/src/features/workspace/data/kanbanColorPalette.js` | 49 |
| `resolveKanbanAccentForeground` | Function | `apps/web/src/features/workspace/data/kanbanColorPalette.js` | 59 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CalendarWorkspaceView → CreateClientId` | cross_community | 6 |
| `CalendarWorkspaceView → NormalizeText` | cross_community | 6 |
| `CalendarWorkspaceView → PadDateNumber` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 6 calls |
| Contracts | 3 calls |
| Auth | 3 calls |
| SettingsPage | 2 calls |
| Workspace | 2 calls |

## How to Explore

1. `gitnexus_context({name: "getFileTypeFromName"})` — see callers and callees
2. `gitnexus_query({query: "data"})` — find related execution flows
3. Read key files listed above for implementation details
