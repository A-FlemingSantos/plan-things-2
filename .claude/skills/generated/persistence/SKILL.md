---
name: persistence
description: "Skill for the Persistence area of plan-things-2. 46 symbols across 7 files."
---

# Persistence

46 symbols | 7 files | Cohesion: 73%

## When to Use

- Working with code in `services/`
- Understanding how AiConversationEntity, AiMessageEntity, createConversation work
- Modifying persistence-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | AiConversationEntity, setWorkspaceId, setPlanId, setCardId, setCreatedByUserId (+10) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | getConversationId, getRole, getStatus, getContentText, getOpenaiResponseId (+6) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | createConversation, normalizeTitle, toMessageDetails, toDateTime, toMessageBlockDetails (+3) |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java` | getBlockType, getPosition, getEntityType, getEntityId, getHref (+3) |
| `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | createConversation, createMessage |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | getWorkspaceId |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockRepository.java` | findByMessageIdOrderByPositionAsc |

## Entry Points

Start here when exploring this area:

- **`AiConversationEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java:12`
- **`AiMessageEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java:13`
- **`createConversation`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java:48`
- **`createConversation`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java:71`
- **`normalizeTitle`** (Method) — `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java:229`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AiConversationEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 12 |
| `AiMessageEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 13 |
| `createConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationController.java` | 48 |
| `createConversation` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 71 |
| `normalizeTitle` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 229 |
| `setWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 49 |
| `setPlanId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 57 |
| `setCardId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 65 |
| `setCreatedByUserId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 73 |
| `setTitle` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 81 |
| `setScopeType` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 89 |
| `setStatus` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiConversationEntity.java` | 97 |
| `getWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 33 |
| `toMessageDetails` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 178 |
| `toDateTime` | Method | `services/api/src/main/java/com/planthings/api/intelligence/AiConversationService.java` | 225 |
| `findByMessageIdOrderByPositionAsc` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockRepository.java` | 8 |
| `getConversationId` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 42 |
| `getRole` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 50 |
| `getStatus` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 58 |
| `getContentText` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageEntity.java` | 66 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateConversation → UnauthorizedException` | cross_community | 6 |
| `CreateMessage → UnauthorizedException` | cross_community | 6 |
| `CreateConversation → WorkspaceEntity` | cross_community | 5 |
| `CreateConversation → SetOwnerUserId` | cross_community | 5 |
| `CreateConversation → GetId` | cross_community | 5 |
| `CreateConversation → SetName` | cross_community | 5 |
| `ListMessages → GetId` | cross_community | 5 |
| `ListMessages → GetBlockType` | cross_community | 5 |
| `ListMessages → GetPosition` | cross_community | 5 |
| `ListMessages → GetTitle` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 13 calls |
| Intelligence | 3 calls |
| Board | 2 calls |
| Auth | 2 calls |

## How to Explore

1. `gitnexus_context({name: "AiConversationEntity"})` — see callers and callees
2. `gitnexus_query({query: "persistence"})` — find related execution flows
3. Read key files listed above for implementation details
