---
name: gitnexus-area-tools
description: "Skill for the Tools area of plan-things-2. 45 symbols across 9 files."
---

# Tools

45 symbols | 9 files | Cohesion: 55%

## When to Use

- Working with code in `services/`
- Understanding how errorNode, executeCapability, failedAudit work
- Modifying tools-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | errorNode, executeCapability, failedAudit, failedAudit, failedOutcome (+16) |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | buildCardSummary, normalizeQuery, searchCards, getBoard, getPlan (+4) |
| `services/api/src/test/java/com/planthings/api/intelligence/tools/AiModelToolRouterTest.java` | shouldAcceptOpenAiWireToolNames, shouldAggregateContextSearchResults, shouldCaptureCapabilityExceptionAsStructuredFailure, shouldReturnRecoverableErrorWhenEntityIdIsInvalid |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiCapabilityRegistry.java` | toOpenAiToolName, normalizeToolName, toCanonicalToolName |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRegistry.java` | buildContextSearchSchema, buildEntityGetSchema, buildTools |
| `services/api/src/main/java/com/planthings/api/intelligence/blocks/AiEntityHrefBuilder.java` | cardBoardHref, planBoardHref |
| `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | searchByPlanId |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | getTitle |
| `services/api/src/test/java/com/planthings/api/intelligence/tools/AiModelToolRegistryTest.java` | shouldExposeOnlyReadOnlyModelFacingTools |

## Entry Points

Start here when exploring this area:

- **`errorNode`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java:334`
- **`executeCapability`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java:134`
- **`failedAudit`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java:197`
- **`failedAudit`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java:206`
- **`failedOutcome`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java:183`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `errorNode` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 334 |
| `executeCapability` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 134 |
| `failedAudit` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 197 |
| `failedAudit` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 206 |
| `failedOutcome` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 183 |
| `serialize` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 343 |
| `toDurationMillis` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 330 |
| `get` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 388 |
| `searchByPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | 20 |
| `getTitle` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 35 |
| `cardBoardHref` | Method | `services/api/src/main/java/com/planthings/api/intelligence/blocks/AiEntityHrefBuilder.java` | 16 |
| `buildCardSummary` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 357 |
| `normalizeQuery` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 353 |
| `searchCards` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 192 |
| `planBoardHref` | Method | `services/api/src/main/java/com/planthings/api/intelligence/blocks/AiEntityHrefBuilder.java` | 12 |
| `getBoard` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 135 |
| `getPlan` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 104 |
| `normalizedEntity` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 380 |
| `requirePlanInScope` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 323 |
| `resolvePlanId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 313 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateMessage → BuildContextSearchSchema` | cross_community | 5 |
| `CreateMessage → BuildEntityGetSchema` | cross_community | 5 |
| `ProcessResponse → IsToolsEnabled` | cross_community | 4 |
| `ProcessResponse → GetDisabledModelTools` | cross_community | 4 |
| `ExecuteContextSearch → FindByUserId` | cross_community | 4 |
| `ExecuteContextSearch → GetId` | cross_community | 4 |
| `ExecuteContextSearch → ApiException` | cross_community | 4 |
| `ExecuteContextSearch → GetWorkspaceId` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 7 calls |
| Board | 6 calls |
| Intelligence | 2 calls |
| Github | 2 calls |
| Calendar | 1 calls |

## How to Explore

1. `context({name: "errorNode"})` — see callers and callees
2. `query({search_query: "tools"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
