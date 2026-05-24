---
name: calendarpage
description: "Skill for the CalendarPage area of plan-things-2. 62 symbols across 3 files."
---

# CalendarPage

62 symbols | 3 files | Cohesion: 75%

## When to Use

- Working with code in `apps/`
- Understanding how deleteEvent, CalendarWorkspaceView, cells work
- Modifying calendarpage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | createCalendarDate, yearOf, monthOf, dayOfMonth, dateFromKey (+54) |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | formatClockTime, formatIntl |
| `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | deleteEvent |

## Entry Points

Start here when exploring this area:

- **`deleteEvent`** (Function) — `apps/web/src/features/calendar/hooks/useCalendarEvents.js:251`
- **`CalendarWorkspaceView`** (Function) — `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx:434`
- **`cells`** (Function) — `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx:467`
- **`showNotification`** (Function) — `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx:501`
- **`goToday`** (Function) — `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx:512`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `deleteEvent` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 251 |
| `CalendarWorkspaceView` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 434 |
| `cells` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 467 |
| `showNotification` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 501 |
| `goToday` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 512 |
| `selectDate` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 517 |
| `shiftMonth` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 527 |
| `handleEditEvent` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 538 |
| `handleSaveEvent` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 548 |
| `handleDeleteEvent` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 561 |
| `handleDeleteEventAttempt` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 565 |
| `renderMonthGrid` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 596 |
| `renderRangeView` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 631 |
| `formatEventPrimaryTime` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 457 |
| `formatEventEndTime` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 458 |
| `formatEventRangeLabel` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 459 |
| `eventsByDate` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 468 |
| `formatClockTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 651 |
| `weekdayLabels` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 451 |
| `formatLongDateLabel` | Function | `apps/web/src/features/calendar/pages/CalendarPage/CalendarPage.jsx` | 452 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CalendarWorkspaceView → CreateClientId` | cross_community | 6 |
| `CalendarWorkspaceView → NormalizeText` | cross_community | 6 |
| `CalendarWorkspaceView → PadDateNumber` | cross_community | 5 |
| `RenderRangeView → YearOf` | intra_community | 4 |
| `RenderRangeView → MonthOf` | intra_community | 4 |
| `RenderRangeView → DayOfMonth` | intra_community | 4 |
| `RenderRangeView → CreateCalendarDate` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 3 calls |
| Hooks | 2 calls |
| SettingsPage | 1 calls |
| Data | 1 calls |

## How to Explore

1. `gitnexus_context({name: "deleteEvent"})` — see callers and callees
2. `gitnexus_query({query: "calendarpage"})` — find related execution flows
3. Read key files listed above for implementation details
