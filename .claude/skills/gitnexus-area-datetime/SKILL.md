---
name: gitnexus-area-datetime
description: "Skill for the DateTime area of plan-things-2. 37 symbols across 8 files."
---

# DateTime

37 symbols | 8 files | Cohesion: 90%

## When to Use

- Working with code in `apps/`
- Understanding how setVisibleMonth, calendarRangeLabel, cells work
- Modifying datetime-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | calendarRangeLabel, cells, formatShortDateLabel, formatShortMonthLabel, goToday (+5) |
| `apps/web/src/shared/utils/dateTime/calendarDate.js` | createCalendarDate, dayOfMonth, daysInMonth, isSameDate, monthOf (+3) |
| `apps/web/src/shared/utils/dateTime/dateFormatting.js` | buildWeekdayLabels, capitalizeFirst, formatCellLabel, formatLongDate, formatRangeLabel (+2) |
| `apps/web/src/shared/utils/dateTime/dateArithmetic.js` | addDays, addMonths, clampDateToMonth, startOfMonth, startOfWeek (+1) |
| `apps/web/src/shared/utils/dateTime/calendarGrid.js` | buildMonthCells, buildRangeDays |
| `apps/web/src/shared/utils/dateTime/dateKeys.js` | addDaysToDateKey, localWallDateKey |
| `apps/mobile/src/components/CardModalRangeCalendar.js` | setVisibleMonth |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardPlanner.js` | tomorrowKey |

## Entry Points

Start here when exploring this area:

- **`setVisibleMonth`** (Function) — `apps/mobile/src/components/CardModalRangeCalendar.js:116`
- **`calendarRangeLabel`** (Function) — `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx:282`
- **`cells`** (Function) — `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx:271`
- **`formatShortDateLabel`** (Function) — `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx:257`
- **`formatShortMonthLabel`** (Function) — `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx:258`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `setVisibleMonth` | Function | `apps/mobile/src/components/CardModalRangeCalendar.js` | 116 |
| `calendarRangeLabel` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 282 |
| `cells` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 271 |
| `formatShortDateLabel` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 257 |
| `formatShortMonthLabel` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 258 |
| `goToday` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 299 |
| `rangeDays` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 286 |
| `renderMonthGrid` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 383 |
| `selectDate` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 304 |
| `shiftMonth` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 314 |
| `weekdayLabels` | Function | `apps/web/src/features/calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx` | 255 |
| `createCalendarDate` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 0 |
| `dayOfMonth` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 12 |
| `daysInMonth` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 36 |
| `isSameDate` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 32 |
| `monthOf` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 8 |
| `utcCalendarDateKey` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 20 |
| `weekdayOf` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 16 |
| `yearOf` | Function | `apps/web/src/shared/utils/dateTime/calendarDate.js` | 4 |
| `buildMonthCells` | Function | `apps/web/src/shared/utils/dateTime/calendarGrid.js` | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| CalendarWorkspaceView | 1 calls |

## How to Explore

1. `context({name: "setVisibleMonth"})` — see callers and callees
2. `query({search_query: "datetime"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
