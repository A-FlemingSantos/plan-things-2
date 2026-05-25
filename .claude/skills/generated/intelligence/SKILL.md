---
name: intelligence
description: "Skill for the Intelligence area of plan-things-2. 22 symbols across 10 files."
---

# Intelligence

22 symbols | 10 files | Cohesion: 75%

## When to Use

- Working with code in `services/`
- Understanding how IntelligenceProperties, deleteByOwnerTypeAndOwnerId, remove work
- Modifying intelligence-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | IntelligenceProperties, setEnabled, setApiKey, isEnabled, getModel |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | getConversation, listMessages, streamConversation, getStatus |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | getConversation, listMessages, requireOwnedConversation |
| `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceFeatureService.java` | requireEnabled, requireConfigured, properties |
| `services/api/src/test/java/com/planthings/api/intelligence/openai/DefaultAiOpenAiClientTest.java` | shouldReportConfiguredWhenEnabledWithApiKey, shouldExtractOutputTextFromResponsesPayload |
| `services/api/src/main/java/com/planthings/api/avatar/AvatarImageRepository.java` | deleteByOwnerTypeAndOwnerId |
| `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | remove |
| `services/api/src/main/java/com/planthings/api/intelligence/AiStreamingService.java` | openStream |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationRepository.java` | findByIdAndCreatedByUserId |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageRepository.java` | findByConversationIdOrderByCreatedAtAsc |

## Entry Points

Start here when exploring this area:

- **`IntelligenceProperties`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java:6`
- **`deleteByOwnerTypeAndOwnerId`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageRepository.java:11`
- **`remove`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java:39`
- **`getConversation`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java:60`
- **`listMessages`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java:65`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `IntelligenceProperties` | Class | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 6 |
| `deleteByOwnerTypeAndOwnerId` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageRepository.java` | 11 |
| `remove` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 39 |
| `getConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 60 |
| `listMessages` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 65 |
| `streamConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 78 |
| `getConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 118 |
| `listMessages` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 125 |
| `requireOwnedConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 164 |
| `openStream` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiStreamingService.java` | 31 |
| `requireEnabled` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceFeatureService.java` | 20 |
| `requireConfigured` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceFeatureService.java` | 29 |
| `findByIdAndCreatedByUserId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationRepository.java` | 9 |
| `findByConversationIdOrderByCreatedAtAsc` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageRepository.java` | 8 |
| `setEnabled` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 23 |
| `setApiKey` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 31 |
| `getStatus` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 38 |
| `properties` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceFeatureService.java` | 16 |
| `isEnabled` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 19 |
| `getModel` | Method | `services/api/src/main/java/com/planthings/api/intelligence/IntelligenceProperties.java` | 35 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateMessage → UnauthorizedException` | cross_community | 6 |
| `ListMessages → GetId` | cross_community | 5 |
| `ListMessages → GetBlockType` | cross_community | 5 |
| `ListMessages → GetPosition` | cross_community | 5 |
| `ListMessages → GetTitle` | cross_community | 5 |
| `CreateConversation → IsEnabled` | cross_community | 4 |
| `CreateConversation → ServiceUnavailableException` | cross_community | 4 |
| `CreateMessage → IsEnabled` | cross_community | 4 |
| `CreateMessage → ServiceUnavailableException` | cross_community | 4 |
| `CreateMessage → FindByIdAndCreatedByUserId` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 4 calls |
| Auth | 3 calls |
| Persistence | 2 calls |
| Board | 1 calls |

## How to Explore

1. `gitnexus_context({name: "IntelligenceProperties"})` — see callers and callees
2. `gitnexus_query({query: "intelligence"})` — find related execution flows
3. Read key files listed above for implementation details
