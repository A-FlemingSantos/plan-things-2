---
name: hooks
description: "Skill for the Hooks area of plan-things-2. 58 symbols across 12 files."
---

# Hooks

58 symbols | 12 files | Cohesion: 72%

## When to Use

- Working with code in `apps/`
- Understanding how addCard, createChecklist, createChecklistItem work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | uid, insertCardIntoColumn, addChecklistToCard, replaceChecklistByIdInColumns, replaceCardByIdInColumns (+24) |
| `hooks/gitnexus-hook.cjs` | readInput, parseRgGrepPattern, pickLongestStringValue, extractPattern, resolveCliPath (+6) |
| `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | rawEventsFromSnapshot, mergeRawEvent, assertValidEventPayload, createEvent, updateEvent (+2) |
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | addColumn, handleColumnColorChange, handlePlanSwitch |
| `apps/web/src/features/workspace/components/AddColumnComposer/AddColumnComposer.jsx` | AddColumnComposer |
| `hooks/hook-lock.cjs` | acquireHookSlot |
| `apps/web/src/features/calendar/data/calendarRepository.js` | insertCalendarEvent |
| `apps/web/src/shared/contracts/backendAdapters.js` | buildCalendarEventPayload |
| `apps/web/src/App.jsx` | LegacyPlanRedirect |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | selectPlan |

## Entry Points

Start here when exploring this area:

- **`addCard`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:720`
- **`createChecklist`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:935`
- **`createChecklistItem`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:984`
- **`updateColumns`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:522`
- **`updateCard`** (Function) — `apps/web/src/features/workspace/hooks/useBoardColumns.js:803`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `addCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 720 |
| `createChecklist` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 935 |
| `createChecklistItem` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 984 |
| `updateColumns` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 522 |
| `updateCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 803 |
| `addCardComment` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 899 |
| `deleteChecklist` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 965 |
| `updateChecklistItem` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 1023 |
| `AddColumnComposer` | Function | `apps/web/src/features/workspace/components/AddColumnComposer/AddColumnComposer.jsx` | 0 |
| `createColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 527 |
| `renameColumn` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 613 |
| `changeColColor` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 668 |
| `addColumn` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 902 |
| `handleColumnColorChange` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1021 |
| `insertCalendarEvent` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 60 |
| `createEvent` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 174 |
| `updateEvent` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 206 |
| `buildCalendarEventPayload` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 621 |
| `selectPlan` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 286 |
| `openPlan` | Function | `apps/web/src/features/workspace/hooks/useResolvedPlanRoute.js` | 34 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 12 calls |
| Contracts | 8 calls |
| KanbanBoard | 2 calls |

## How to Explore

1. `gitnexus_context({name: "addCard"})` — see callers and callees
2. `gitnexus_query({query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
