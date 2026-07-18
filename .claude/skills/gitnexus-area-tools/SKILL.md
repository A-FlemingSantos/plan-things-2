---
name: gitnexus-area-tools
description: "Skill for the Tools area of plan-things-2. 40 symbols across 8 files."
---

# Tools

40 symbols | 8 files | Cohesion: 58%

## When to Use

- Working with code in `services/`
- Understanding how errorNode, executeCapability, failedAudit work
- Modifying tools-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | errorNode, executeCapability, failedAudit, failedAudit, failedOutcome (+16) |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | getBoard, getPlan, normalizedEntity, requirePlanInScope, resolvePlanId (+1) |
| `services/api/src/test/java/com/planthings/api/intelligence/tools/AiModelToolRouterTest.java` | shouldAcceptOpenAiWireToolNames, shouldAggregateContextSearchResults, shouldCaptureCapabilityExceptionAsStructuredFailure, shouldReturnRecoverableErrorWhenEntityIdIsInvalid |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiCapabilityRegistry.java` | toOpenAiToolName, normalizeToolName, toCanonicalToolName |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRegistry.java` | buildContextSearchSchema, buildEntityGetSchema, buildTools |
| `services/api/src/main/java/com/planthings/api/intelligence/blocks/AiEntityHrefBuilder.java` | planBoardHref |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | getWorkspaceId |
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
| `planBoardHref` | Method | `services/api/src/main/java/com/planthings/api/intelligence/blocks/AiEntityHrefBuilder.java` | 12 |
| `getBoard` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 135 |
| `getPlan` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 104 |
| `normalizedEntity` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 380 |
| `requirePlanInScope` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 323 |
| `resolvePlanId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiReadOnlyCapabilityService.java` | 313 |
| `getWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 33 |
| `appendArrayResults` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 239 |
| `appendIfNew` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 256 |
| `appendSingleEntityResult` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 226 |
| `executeContextSearch` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 61 |
| `requireLimit` | Method | `services/api/src/main/java/com/planthings/api/intelligence/tools/AiModelToolRouter.java` | 300 |

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
| Files | 3 calls |
| Board | 3 calls |
| Intelligence | 2 calls |
| Blocks | 2 calls |

## How to Explore

1. `context({name: "errorNode"})` — see callers and callees
2. `query({search_query: "tools"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
