---
name: gitnexus-area-intelligence
description: "Skill for the Intelligence area of plan-things-2. 94 symbols across 18 files."
---

# Intelligence

94 symbols | 18 files | Cohesion: 73%

## When to Use

- Working with code in `services/`
- Understanding how IntelligenceProperties, AiMessageEntity, cancelMessage work
- Modifying intelligence-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | buildFunctionCallInputItems, buildFunctionCallOutputItem, executeModelTool, executeResponseLoop, executeToolCalls (+16) |
| `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | getDisabledCapabilities, getDisabledModelTools, isToolsEnabled, setDisabledCapabilities, setDisabledModelTools (+11) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiContextBuilder.java` | appendAttachmentLines, appendChipLines, deserializeSnapshotForApi, formatSnapshotForPrompt, parseSnapshotJson (+5) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | cancelMessage, getConversation, listMessages, streamConversation, createMessage (+2) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | getConversation, listMessages, requireOwnedConversation, createUserMessage, normalizeContent (+2) |
| `services/api/src/test/java/com/planthings/api/intelligence/AiContextBuilderTest.java` | shouldFormatSnapshotForPrompt, shouldAcceptFrontendGeneratedAttachmentType, shouldAcceptUuidBackedPlanChipType, shouldRejectChipIconInContextChips, shouldRejectUnknownSnapshotFields |
| `services/api/src/test/java/com/planthings/api/intelligence/openai/DefaultAiOpenAiClientTest.java` | shouldExtractCompactionOutputItems, shouldExtractOutputTextFromResponsesPayload, shouldReportConfiguredWhenEnabledWithApiKey, shouldSerializeToolsAndTrailingInputItemsIntoResponsesBody |
| `services/api/src/main/java/com/planthings/api/intelligence/tools/AiToolPermissionService.java` | isCapabilityEnabled, isModelToolEnabled, normalize |
| `services/api/src/test/java/com/planthings/api/intelligence/tools/AiToolPermissionServiceTest.java` | shouldDisableAllToolsWhenToolsFlagIsOff, shouldDisableSpecificConfiguredToolAndCapability, shouldRequirePlanScopeForCardSearchCapability |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | AiMessageEntity, setConversationId, setRole |

## Entry Points

Start here when exploring this area:

- **`IntelligenceProperties`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java:8`
- **`AiMessageEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java:13`
- **`cancelMessage`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java:119`
- **`buildFunctionCallInputItems`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java:517`
- **`buildFunctionCallOutputItem`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java:509`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `IntelligenceProperties` | Class | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 8 |
| `AiMessageEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 13 |
| `cancelMessage` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 119 |
| `buildFunctionCallInputItems` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 517 |
| `buildFunctionCallOutputItem` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 509 |
| `executeModelTool` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 449 |
| `executeResponseLoop` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 344 |
| `executeToolCalls` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 397 |
| `extractFunctionCalls` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 534 |
| `isCancellationRequested` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 256 |
| `markAssistantStreaming` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 580 |
| `normalizeOutputText` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 802 |
| `processResponse` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 144 |
| `requestCancellation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 121 |
| `serializeJson` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 811 |
| `streamAssistantDelta` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | 592 |
| `sendEvent` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiStreamingService.java` | 61 |
| `getDisabledCapabilities` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 104 |
| `getDisabledModelTools` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 96 |
| `isToolsEnabled` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 88 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateMessage → ApiException` | cross_community | 5 |
| `CreateMessage → BuildContextSearchSchema` | cross_community | 5 |
| `CreateMessage → BuildEntityGetSchema` | cross_community | 5 |
| `CreateMessage → GetCompactThreshold` | cross_community | 5 |
| `CreateMessage → SetConversationId` | cross_community | 5 |
| `CreateMessage → SetMessageId` | cross_community | 5 |
| `CancelMessage → ApiException` | cross_community | 5 |
| `ListMessages → ApiException` | intra_community | 5 |
| `ListMessages → GetId` | cross_community | 5 |
| `ListMessages → GetBlockType` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Persistence | 17 calls |
| Board | 7 calls |
| Files | 4 calls |
| Tools | 4 calls |
| Openai | 2 calls |
| Api | 2 calls |

## How to Explore

1. `context({name: "IntelligenceProperties"})` — see callers and callees
2. `query({search_query: "intelligence"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
