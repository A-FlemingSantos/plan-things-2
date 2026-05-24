---
name: contracts
description: "Skill for the Contracts area of plan-things-2. 55 symbols across 9 files."
---

# Contracts

55 symbols | 9 files | Cohesion: 78%

## When to Use

- Working with code in `apps/`
- Understanding how mapBoardCard, mapCalendarEventsToSnapshot, createCalendarEventDraft work
- Modifying contracts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/shared/contracts/backendAdapters.js` | toDate, normalizeShortMonthLabel, normalizeTimeZone, toDateKeyByTimeZone, formatDateInputFromIso (+27) |
| `apps/web/src/shared/contracts/calendarContracts.js` | dateKey, normalizeText, normalizeDateKey, normalizeColor, normalizeCalendarSource (+2) |
| `apps/web/src/shared/contracts/planContracts.js` | extractDayFromDueDate, formatScheduleDateValue, deriveLegacyScheduleFromDueDate, normalizeBoardCardSchedule, normalizeBoardCard |
| `packages/shared-client/src/apiClient.js` | ApiClientError, buildApiUrl, apiRequest |
| `apps/web/src/features/calendar/data/calendarRepository.js` | getSourceById, createCalendarEventDraft |
| `apps/web/src/shared/contracts/mobileBackendIntegrationAdapters.test.js` | fetchImpl, json |
| `apps/web/src/shared/contracts/mobileAuthProviderParity.test.jsx` | createAccessToken, toBase64Url |
| `apps/mobile/src/services/api.js` | mobileApiUrl |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | mappedPlans |

## Entry Points

Start here when exploring this area:

- **`mapBoardCard`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:431`
- **`mapCalendarEventsToSnapshot`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:579`
- **`createCalendarEventDraft`** (Function) — `apps/web/src/features/calendar/data/calendarRepository.js:49`
- **`normalizeCalendarSource`** (Function) — `apps/web/src/shared/contracts/calendarContracts.js:26`
- **`normalizeCalendarEvent`** (Function) — `apps/web/src/shared/contracts/calendarContracts.js:39`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiClientError` | Class | `packages/shared-client/src/apiClient.js` | 0 |
| `mapBoardCard` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 431 |
| `mapCalendarEventsToSnapshot` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 579 |
| `createCalendarEventDraft` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 49 |
| `normalizeCalendarSource` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 26 |
| `normalizeCalendarEvent` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 39 |
| `normalizeCalendarSnapshot` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 61 |
| `buildBoardCardPayload` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 534 |
| `mobileApiUrl` | Function | `apps/mobile/src/services/api.js` | 21 |
| `buildApiUrl` | Function | `packages/shared-client/src/apiClient.js` | 10 |
| `apiRequest` | Function | `packages/shared-client/src/apiClient.js` | 29 |
| `mappedPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 115 |
| `mapPlanSummaryToRecord` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 344 |
| `mergePlanDetails` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 380 |
| `membersMeta` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 381 |
| `toDate` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 68 |
| `normalizeShortMonthLabel` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 77 |
| `normalizeTimeZone` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 81 |
| `toDateKeyByTimeZone` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 239 |
| `formatDateInputFromIso` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 258 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CalendarWorkspaceView → CreateClientId` | cross_community | 6 |
| `CalendarWorkspaceView → NormalizeText` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Data | 4 calls |
| Context | 1 calls |

## How to Explore

1. `gitnexus_context({name: "mapBoardCard"})` — see callers and callees
2. `gitnexus_query({query: "contracts"})` — find related execution flows
3. Read key files listed above for implementation details
