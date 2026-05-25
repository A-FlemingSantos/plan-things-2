---
name: calendar
description: "Skill for the Calendar area of plan-things-2. 37 symbols across 5 files."
---

# Calendar

37 symbols | 5 files | Cohesion: 56%

## When to Use

- Working with code in `services/`
- Understanding how CalendarEventEntity, deleteEvent, getWorkspaceId work
- Modifying calendar-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | getWorkspaceId, getCreatorUserId, getPlanId, getLinkedCardId, getTitle (+14) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | deleteStandaloneEvent, getEventForPlan, toEventSummary, deriveLinkedCardKind, updateStandaloneEvent (+4) |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | deleteEvent, updateEvent, createEvent, listEvents |
| `services/api/src/main/java/com/planthings/api/calendar/CalendarEventRepository.java` | findByWorkspaceIdOrderByStartsAtAsc, findByWorkspaceIdAndStartsAtBetweenOrderByStartsAtAsc, findByPlanIdInOrderByStartsAtAsc, findByPlanIdInAndStartsAtBetweenOrderByStartsAtAsc |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | calendarEventMap |

## Entry Points

Start here when exploring this area:

- **`CalendarEventEntity`** (Class) — `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java:9`
- **`deleteEvent`** (Method) — `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java:62`
- **`getWorkspaceId`** (Method) — `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java:43`
- **`getCreatorUserId`** (Method) — `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java:51`
- **`getPlanId`** (Method) — `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java:59`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CalendarEventEntity` | Class | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 9 |
| `deleteEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | 62 |
| `getWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 43 |
| `getCreatorUserId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 51 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 59 |
| `getLinkedCardId` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 67 |
| `getTitle` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 75 |
| `getDescription` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 83 |
| `getLocation` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 91 |
| `getStartsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 99 |
| `getEndsAt` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 107 |
| `getGeneratedFromCard` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 115 |
| `deleteStandaloneEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | 134 |
| `getEventForPlan` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | 181 |
| `toEventSummary` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | 192 |
| `deriveLinkedCardKind` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarService.java` | 210 |
| `calendarEventMap` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | 613 |
| `updateEvent` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarController.java` | 50 |
| `setTitle` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 79 |
| `setDescription` | Method | `services/api/src/main/java/com/planthings/api/calendar/CalendarEventEntity.java` | 87 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → UnauthorizedException` | cross_community | 6 |
| `ListEvents → UnauthorizedException` | cross_community | 6 |
| `UpdateEvent → UnauthorizedException` | cross_community | 6 |
| `DeleteEvent → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 25 calls |
| Board | 4 calls |

## How to Explore

1. `gitnexus_context({name: "CalendarEventEntity"})` — see callers and callees
2. `gitnexus_query({query: "calendar"})` — find related execution flows
3. Read key files listed above for implementation details
