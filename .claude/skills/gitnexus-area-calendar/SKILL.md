---
name: gitnexus-area-calendar
description: "Skill for the Calendar area of plan-things-2. 55 symbols across 11 files."
---

# Calendar

55 symbols | 11 files | Cohesion: 59%

## When to Use

- Working with code in `services/`
- Understanding how handleConfirmSchedule, saveDateRange, resolvedSchedule work
- Modifying calendar-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | getCreatorUserId, getDescription, getEndsAt, getGeneratedFromCard, getLinkedCardId (+16) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | deleteStandaloneEvent, deriveLinkedCardKind, getEventForPlan, toEventSummary, createStandaloneEvent (+6) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventRepository.java` | findByLinkedCardId, findByPlanIdInAndStartsAtBetweenOrderByStartsAtAsc, findByPlanIdInOrderByStartsAtAsc, findByWorkspaceIdAndStartsAtBetweenOrderByStartsAtAsc, findByWorkspaceIdOrderByStartsAtAsc |
| `apps/web/src/shared/components/Calendar/Calendar.jsx` | Calendar, CalendarGridComponent, CalendarHeader, RangeCalendar, cn |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | deleteEvent, createEvent, updateEvent, listEvents |
| `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | formatCalendarDateToBrazil, isSameCalendarDate, resolveCardScheduleFromRange |
| `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | handleConfirmSchedule, saveDateRange |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | calendarEventMap |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx` | resolvedSchedule |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | formatDueDateLabelFromValue |

## Entry Points

Start here when exploring this area:

- **`handleConfirmSchedule`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:576`
- **`saveDateRange`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:504`
- **`resolvedSchedule`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx:24`
- **`formatDueDateLabelFromValue`** (Function) — `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js:79`
- **`formatCalendarDateToBrazil`** (Function) — `apps/web/src/shared/components/Calendar/calendarDateUtils.js:15`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CalendarEventEntity` | Class | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 9 |
| `handleConfirmSchedule` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 576 |
| `saveDateRange` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 504 |
| `resolvedSchedule` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx` | 24 |
| `formatDueDateLabelFromValue` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 79 |
| `formatCalendarDateToBrazil` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 15 |
| `isSameCalendarDate` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 43 |
| `resolveCardScheduleFromRange` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 48 |
| `Calendar` | Function | `apps/web/src/shared/components/Calendar/Calendar.jsx` | 66 |
| `RangeCalendar` | Function | `apps/web/src/shared/components/Calendar/Calendar.jsx` | 78 |
| `deleteEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | 62 |
| `getCreatorUserId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 51 |
| `getDescription` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 83 |
| `getEndsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 107 |
| `getGeneratedFromCard` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 115 |
| `getLinkedCardId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 67 |
| `getLocation` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 91 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 59 |
| `getStartsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 99 |
| `getTitle` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 75 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → ApiException` | cross_community | 7 |
| `UpdateEvent → ApiException` | cross_community | 7 |
| `DeleteEvent → ApiException` | cross_community | 7 |
| `ListEvents → ApiException` | cross_community | 7 |
| `CreateEvent → GetUserId` | cross_community | 5 |
| `UpdateEvent → GetUserId` | cross_community | 5 |
| `DeleteEvent → GetUserId` | cross_community | 5 |
| `ListEvents → GetUserId` | cross_community | 5 |
| `ExecuteContextSearch → GetWorkspaceId` | cross_community | 4 |
| `CreateEvent → FindByOwnerUserId` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 31 calls |
| Board | 2 calls |
| Components | 1 calls |
| CardModal | 1 calls |

## How to Explore

1. `context({name: "handleConfirmSchedule"})` — see callers and callees
2. `query({search_query: "calendar"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
