---
name: gitnexus-area-contracts
description: "Skill for the Contracts area of plan-things-2. 52 symbols across 8 files."
---

# Contracts

52 symbols | 8 files | Cohesion: 78%

## When to Use

- Working with code in `apps/`
- Understanding how hydrateBackendPlans, mapPlanSummaryToRecord, mergePlanDetails work
- Modifying contracts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/shared/contracts/backendAdapters.js` | buildInitials, buildMemberColor, buildMemberDots, canonicalizeCoverImageId, mapPlanSummaryToRecord (+27) |
| `apps/web/src/shared/contracts/calendarContracts.js` | dateKey, normalizeCalendarEvent, normalizeCalendarSource, normalizeColor, normalizeDateKey (+1) |
| `apps/web/src/shared/contracts/planContracts.js` | deriveLegacyScheduleFromDueDate, extractDayFromDueDate, formatScheduleDateValue, normalizeBoardCard, normalizeBoardCardSchedule |
| `packages/shared-client/src/apiClient.js` | ApiClientError, apiRequest, request |
| `apps/web/src/features/calendar/data/calendarRepository.js` | createCalendarEventDraft, getSourceById |
| `apps/web/src/shared/contracts/mobileAuthProviderParity.test.jsx` | createAccessToken, toBase64Url |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | hydrateBackendPlans |
| `apps/web/src/shared/contracts/mobileBackendIntegrationAdapters.test.js` | fetchImpl |

## Entry Points

Start here when exploring this area:

- **`hydrateBackendPlans`** (Function) — `apps/web/src/features/workspace/context/PlansContext.jsx:102`
- **`mapPlanSummaryToRecord`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:358`
- **`mergePlanDetails`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:394`
- **`mapBoardCard`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:447`
- **`mapCalendarEventsToSnapshot`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:600`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiClientError` | Class | `packages/shared-client/src/apiClient.js` | 0 |
| `hydrateBackendPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 102 |
| `mapPlanSummaryToRecord` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 358 |
| `mergePlanDetails` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 394 |
| `mapBoardCard` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 447 |
| `mapCalendarEventsToSnapshot` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 600 |
| `buildBoardCardPayload` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 555 |
| `createCalendarEventDraft` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 49 |
| `normalizeCalendarEvent` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 39 |
| `normalizeCalendarSource` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 26 |
| `apiRequest` | Function | `packages/shared-client/src/apiClient.js` | 29 |
| `request` | Method | `packages/shared-client/src/apiClient.js` | 101 |
| `buildInitials` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 339 |
| `buildMemberColor` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 335 |
| `buildMemberDots` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 354 |
| `canonicalizeCoverImageId` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 30 |
| `mapRoleToTag` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 348 |
| `resolveCoverImageThumbUrl` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 60 |
| `resolveCoverImageUrl` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 48 |
| `resolveUploadedCoverImageUrl` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 41 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RenderPlannerItem → NormalizeTimeZone` | cross_community | 6 |
| `HandleSubmit → FetchImpl` | cross_community | 5 |
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `HandleSubmit → ApiClientError` | cross_community | 5 |
| `UploadLocalFileToCard → FetchImpl` | cross_community | 4 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |
| `UploadLocalFileToCard → ApiClientError` | cross_community | 4 |
| `AttachFileToCard → FetchImpl` | cross_community | 4 |
| `AttachFileToCard → BuildApiUrl` | cross_community | 4 |
| `AttachFileToCard → ApiClientError` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Data | 5 calls |
| SettingsPage | 1 calls |
| Context | 1 calls |
| Providers | 1 calls |

## How to Explore

1. `context({name: "hydrateBackendPlans"})` — see callers and callees
2. `query({search_query: "contracts"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
