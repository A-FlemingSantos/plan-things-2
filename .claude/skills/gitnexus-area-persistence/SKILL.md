---
name: gitnexus-area-persistence
description: "Skill for the Persistence area of plan-things-2. 108 symbols across 23 files."
---

# Persistence

108 symbols | 23 files | Cohesion: 76%

## When to Use

- Working with code in `services/`
- Understanding how AiCompactionItemEntity, AiToolCallEntity, AiMessageBlockEntity work
- Modifying persistence-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java` | AiMessageBlockEntity, setBlockType, setEntityId, setEntityType, setHref (+13) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiToolCallEntity.java` | AiToolCallEntity, setArgumentsJson, setCapabilityId, setCompletedAt, setConversationId (+8) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiResponseOrchestrator.java` | buildLocalConversationInput, failAssistantMessage, handleCancellation, isCompletedConversationalMessage, toOpenAiRole (+6) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | getContentText, getConversationId, getErrorCode, getOpenaiResponseId, getRole (+6) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | AiConversationEntity, setCardId, setCreatedByUserId, setPlanId, setScopeType (+5) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | AiCompactionItemEntity, setCompactThreshold, setCompactionMode, setConversationId, setInputTokenEstimate (+4) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiContextSnapshotEntity.java` | AiContextSnapshotEntity, setContextJson, setConversationId, setMessageId, setPlanId (+2) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | estimateInputTokens, extractOutputItemRef, loadLatestCompactionInputItems, recordCompactionOutput, recordCompactionThresholdAudit |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | cancelAssistantMessage, toMessageDetails, toMessageBlockDetails, persistContextSnapshot, createConversation |
| `services/api/src/test/java/com/planthings/api/intelligence/AiCompactionServiceTest.java` | shouldLoadOnlyCompactionOutputItems, shouldNotLoadThresholdAuditRowsAsOpenAiInput, shouldSkipNonCompactionOutputItems |

## Entry Points

Start here when exploring this area:

- **`AiCompactionItemEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java:9`
- **`AiToolCallEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiToolCallEntity.java:13`
- **`AiMessageBlockEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java:12`
- **`AiContextSnapshotEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiContextSnapshotEntity.java:9`
- **`AiConversationEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AiCompactionItemEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 9 |
| `AiToolCallEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiToolCallEntity.java` | 13 |
| `AiMessageBlockEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java` | 12 |
| `AiContextSnapshotEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiContextSnapshotEntity.java` | 9 |
| `AiConversationEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 12 |
| `estimateInputTokens` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | 141 |
| `extractOutputItemRef` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | 157 |
| `loadLatestCompactionInputItems` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | 33 |
| `recordCompactionOutput` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | 41 |
| `recordCompactionThresholdAudit` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiCompactionService.java` | 92 |
| `getCompactThreshold` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 80 |
| `setCompactThreshold` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 74 |
| `setCompactionMode` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 66 |
| `setConversationId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 42 |
| `setInputTokenEstimate` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 82 |
| `setMessageId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 50 |
| `setOpaquePayloadJson` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 98 |
| `setOpenaiResponseId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 58 |
| `setOutputItemRef` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemEntity.java` | 90 |
| `findTopByConversationIdAndCompactionModeOrderByCreatedAtDesc` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiCompactionItemRepository.java` | 7 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateConversation → ApiException` | cross_community | 7 |
| `CreateMessage → GetCompactThreshold` | cross_community | 5 |
| `CreateMessage → SetConversationId` | cross_community | 5 |
| `CreateMessage → SetMessageId` | cross_community | 5 |
| `CancelMessage → ApiException` | cross_community | 5 |
| `CreateConversation → GetUserId` | cross_community | 5 |
| `CreateConversation → SetOwnerUserId` | cross_community | 5 |
| `CreateConversation → GetId` | cross_community | 5 |
| `CreateConversation → SetName` | cross_community | 5 |
| `CreateConversation → GetFullName` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 17 calls |
| Intelligence | 15 calls |
| Board | 5 calls |
| Blocks | 2 calls |
| Tools | 1 calls |
| Plans | 1 calls |

## How to Explore

1. `context({name: "AiCompactionItemEntity"})` — see callers and callees
2. `query({search_query: "persistence"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
