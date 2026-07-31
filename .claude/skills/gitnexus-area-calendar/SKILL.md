---
name: gitnexus-area-calendar
description: "Skill for the Calendar area of plan-things-2. 54 symbols across 10 files."
---

# Calendar

54 symbols | 10 files | Cohesion: 72%

## When to Use

- Working with code in `services/`
- Understanding how handleConfirmSchedule, saveDateRange, resolvedSchedule work
- Modifying calendar-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | CalendarEventEntity, setCreatorUserId, setDescription, setEndsAt, setGeneratedFromCard (+16) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | createStandaloneEvent, normalizeOptional, removeCardEvent, requireTitle, syncCardEvent (+6) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventRepository.java` | findByLinkedCardId, findByPlanIdInAndStartsAtBetweenOrderByStartsAtAsc, findByPlanIdInOrderByStartsAtAsc, findByWorkspaceIdAndStartsAtBetweenOrderByStartsAtAsc, findByWorkspaceIdOrderByStartsAtAsc |
| `apps/web/src/shared/components/Calendar/Calendar.jsx` | Calendar, CalendarGridComponent, CalendarHeader, RangeCalendar, cn |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | createEvent, updateEvent, deleteEvent, listEvents |
| `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | formatCalendarDateToBrazil, isSameCalendarDate, resolveCardScheduleFromRange |
| `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | handleConfirmSchedule, saveDateRange |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | calendarEventMap |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx` | resolvedSchedule |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | formatDueDateLabelFromValue |

## Entry Points

Start here when exploring this area:

- **`handleConfirmSchedule`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:567`
- **`saveDateRange`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:495`
- **`resolvedSchedule`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx:24`
- **`formatDueDateLabelFromValue`** (Function) — `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js:79`
- **`formatCalendarDateToBrazil`** (Function) — `apps/web/src/shared/components/Calendar/calendarDateUtils.js:15`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CalendarEventEntity` | Class | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 9 |
| `handleConfirmSchedule` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 567 |
| `saveDateRange` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 495 |
| `resolvedSchedule` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalDateSchedulePicker.jsx` | 24 |
| `formatDueDateLabelFromValue` | Function | `apps/web/src/features/workspace/components/CardModal/utils/cardModalDateUtils.js` | 79 |
| `formatCalendarDateToBrazil` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 15 |
| `isSameCalendarDate` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 43 |
| `resolveCardScheduleFromRange` | Function | `apps/web/src/shared/components/Calendar/calendarDateUtils.js` | 48 |
| `Calendar` | Function | `apps/web/src/shared/components/Calendar/Calendar.jsx` | 66 |
| `RangeCalendar` | Function | `apps/web/src/shared/components/Calendar/Calendar.jsx` | 78 |
| `createEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | 39 |
| `updateEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | 50 |
| `setCreatorUserId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 55 |
| `setDescription` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 87 |
| `setEndsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 111 |
| `setGeneratedFromCard` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 119 |
| `setLinkedCardId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 71 |
| `setLocation` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 95 |
| `setPlanId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 63 |
| `setStartsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 103 |

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
| `CreateEvent → FindByOwnerUserId` | cross_community | 3 |
| `CreateEvent → GetId` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 27 calls |
| Board | 6 calls |
| Tools | 1 calls |
| Components | 1 calls |
| CardModal | 1 calls |

## How to Explore

1. `context({name: "handleConfirmSchedule"})` — see callers and callees
2. `query({search_query: "calendar"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
