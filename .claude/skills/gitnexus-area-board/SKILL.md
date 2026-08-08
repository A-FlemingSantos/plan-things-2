---
name: gitnexus-area-board
description: "Skill for the Board area of plan-things-2. 155 symbols across 38 files."
---

# Board

155 symbols | 38 files | Cohesion: 55%

## When to Use

- Working with code in `services/`
- Understanding how BoardCardInboxDeliveryEntity, BoardCardInboxDeliveryRecipientEntity, BoardCardEntity work
- Modifying board-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | addComment, buildBoardView, createColumn, ensureDefaultLabels, getBoard (+34) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | getAssigneeUserId, getCompleted, getDueAt, getPositionIndex, getStartAt (+10) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | getColumnId, setAuthorUserId, setColumnId, setDescription, setDueAt (+8) |
| `services/api/src/main/java/com/planthings/api/board/BoardController.java` | deleteCard, moveCard, updateCard, updateCompactColumns, updateChecklistItem (+6) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | BoardCardInboxDeliveryEntity, setCardId, setMessageId, setPlanId, setSentByUserId (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | BoardChecklistEntity, setCardId, setTitle, getCardId, setPositionIndex (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | setColor, setPlanId, setStatus, setTitle, BoardColumnEntity (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | BoardCardInboxDeliveryRecipientEntity, setDeliveryId, setEmail, setUserId, getDeliveryId (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnViewPreferenceEntity.java` | getColumnId, BoardColumnViewPreferenceEntity, setColumnId, setPlanId, setUserId |
| `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | BoardCardCommentEntity, setAuthorUserId, setCardId, setKind, setMessage |

## Entry Points

Start here when exploring this area:

- **`BoardCardInboxDeliveryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java:8`
- **`BoardCardInboxDeliveryRecipientEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java:8`
- **`BoardCardEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java:9`
- **`BoardColumnEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java:8`
- **`BaseEntity`** (Class) — `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BoardCardInboxDeliveryEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | 8 |
| `BoardCardInboxDeliveryRecipientEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | 8 |
| `BoardCardEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 9 |
| `BoardColumnEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 8 |
| `BaseEntity` | Class | `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java` | 11 |
| `FileBlobEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 9 |
| `PlanEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 8 |
| `BoardColumnViewPreferenceEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardColumnViewPreferenceEntity.java` | 9 |
| `BoardCardAssigneeEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardAssigneeEntity.java` | 8 |
| `BoardCardCommentEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | 10 |
| `BoardChecklistEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | 8 |
| `BoardChecklistItemEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | 9 |
| `BoardCardInboxEmailSender` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java` | 17 |
| `setColor` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 47 |
| `setPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 31 |
| `setStatus` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 55 |
| `setTitle` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 39 |
| `getColumnId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnViewPreferenceEntity.java` | 44 |
| `findByUserIdAndPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnViewPreferenceRepository.java` | 11 |
| `addComment` | Method | `services/api/src/main/java/com/planthings/api/board/BoardService.java` | 329 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DisconnectGitHubIntegration → ApiException` | cross_community | 8 |
| `CreateEvent → ApiException` | cross_community | 7 |
| `CreateFolder → ApiException` | cross_community | 7 |
| `CreateConversation → ApiException` | cross_community | 7 |
| `CreatePlan → ApiException` | cross_community | 7 |
| `ListFiles → ApiException` | cross_community | 7 |
| `DeleteAccount → ApiException` | cross_community | 7 |
| `StartGmailIntegration → ApiException` | cross_community | 7 |
| `StartGitHubIntegration → ApiException` | cross_community | 7 |
| `SearchGitHubRepositories → ApiException` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 48 calls |
| Plans | 12 calls |
| Github | 7 calls |
| Persistence | 7 calls |
| Api | 4 calls |
| Calendar | 3 calls |
| Intelligence | 2 calls |
| Blocks | 1 calls |

## How to Explore

1. `context({name: "BoardCardInboxDeliveryEntity"})` — see callers and callees
2. `query({search_query: "board"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
