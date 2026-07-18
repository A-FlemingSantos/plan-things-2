---
name: gitnexus-area-contracts
description: "Skill for the Contracts area of plan-things-2. 76 symbols across 9 files."
---

# Contracts

76 symbols | 9 files | Cohesion: 78%

## When to Use

- Working with code in `apps/`
- Understanding how mapBoardCard, mapCalendarEventsToSnapshot, mapPlanSummaryToRecord work
- Modifying contracts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/shared/contracts/backendAdapters.js` | dayOfMonthFromDateKey, formatCardDueLabel, formatCompactDayMonthFromIso, formatDateInputFromIso, formatTimeInputFromIso (+27) |
| `apps/web/src/shared/contracts/intelligenceContracts.js` | buildThreadMessage, createCompletedAssistantMessage, createOptimisticAssistantPlaceholder, createOptimisticUserMessage, createThreadMessageId (+16) |
| `apps/web/src/shared/contracts/calendarContracts.js` | dateKey, normalizeCalendarEvent, normalizeCalendarSource, normalizeColor, normalizeDateKey (+1) |
| `apps/web/src/shared/contracts/planContracts.js` | deriveLegacyScheduleFromDueDate, extractDayFromDueDate, formatScheduleDateValue, normalizeBoardCard, normalizeBoardCardSchedule |
| `apps/web/src/features/intelligence/hooks/useMockAiConversation.js` | clearResponseTimer, submitMessage, timer, useMockAiConversation |
| `packages/shared-client/src/apiClient.js` | ApiClientError, apiRequest, request |
| `apps/web/src/features/calendar/data/calendarRepository.js` | createCalendarEventDraft, getSourceById |
| `apps/web/src/shared/contracts/mobileAuthProviderParity.test.jsx` | createAccessToken, toBase64Url |
| `apps/web/src/shared/contracts/mobileBackendIntegrationAdapters.test.js` | fetchImpl |

## Entry Points

Start here when exploring this area:

- **`mapBoardCard`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:447`
- **`mapCalendarEventsToSnapshot`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:596`
- **`mapPlanSummaryToRecord`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:358`
- **`mergePlanDetails`** (Function) — `apps/web/src/shared/contracts/backendAdapters.js:394`
- **`clearResponseTimer`** (Function) — `apps/web/src/features/intelligence/hooks/useMockAiConversation.js:39`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiClientError` | Class | `packages/shared-client/src/apiClient.js` | 0 |
| `mapBoardCard` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 447 |
| `mapCalendarEventsToSnapshot` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 596 |
| `mapPlanSummaryToRecord` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 358 |
| `mergePlanDetails` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 394 |
| `clearResponseTimer` | Function | `apps/web/src/features/intelligence/hooks/useMockAiConversation.js` | 39 |
| `submitMessage` | Function | `apps/web/src/features/intelligence/hooks/useMockAiConversation.js` | 45 |
| `timer` | Function | `apps/web/src/features/intelligence/hooks/useMockAiConversation.js` | 109 |
| `useMockAiConversation` | Function | `apps/web/src/features/intelligence/hooks/useMockAiConversation.js` | 22 |
| `createCompletedAssistantMessage` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 502 |
| `createOptimisticAssistantPlaceholder` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 489 |
| `createOptimisticUserMessage` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 473 |
| `createThreadMessageId` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 232 |
| `buildBoardCardPayload` | Function | `apps/web/src/shared/contracts/backendAdapters.js` | 551 |
| `createCalendarEventDraft` | Function | `apps/web/src/features/calendar/data/calendarRepository.js` | 49 |
| `normalizeCalendarEvent` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 39 |
| `normalizeCalendarSource` | Function | `apps/web/src/shared/contracts/calendarContracts.js` | 26 |
| `normalizeAiMessageBlock` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 285 |
| `normalizeStructuredAssistantResponse` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 530 |
| `normalizeThreadInlineArtifact` | Function | `apps/web/src/shared/contracts/intelligenceContracts.js` | 303 |

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
| Hooks | 3 calls |
| Mock | 1 calls |
| Context | 1 calls |
| Providers | 1 calls |

## How to Explore

1. `context({name: "mapBoardCard"})` — see callers and callees
2. `query({search_query: "contracts"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
