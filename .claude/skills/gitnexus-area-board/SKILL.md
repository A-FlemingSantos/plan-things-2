---
name: gitnexus-area-board
description: "Skill for the Board area of plan-things-2. 180 symbols across 39 files."
---

# Board

180 symbols | 39 files | Cohesion: 55%

## When to Use

- Working with code in `services/`
- Understanding how BoardCardInboxDeliveryEntity, BoardCardInboxDeliveryRecipientEntity, BoardCardEntity work
- Modifying board-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | addComment, buildBoardView, createColumn, deleteColumn, ensureDefaultLabels (+33) |
| `services/api/src/main/java/com/planthings/api/board/BoardController.java` | addComment, createCard, createColumn, deleteCard, deleteColumn (+11) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | getAssigneeUserId, getCompleted, getDueAt, getPositionIndex, getStartAt (+10) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | getColumnId, setAuthorUserId, setColumnId, setCompleted, setDescription (+8) |
| `services/api/src/main/java/com/planthings/api/files/FileController.java` | delete, favorite, permanentlyDelete, removeAttachment, restore (+4) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | changePassword, deleteAccount, listActiveSessions, removeAccountAvatar, revokeOtherSessions (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | BoardCardInboxDeliveryEntity, setCardId, setMessageId, setPlanId, setSentByUserId (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | BoardChecklistEntity, setCardId, setTitle, getCardId, setPositionIndex (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | setColor, setPlanId, setPositionIndex, setStatus, setTitle (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | BoardCardInboxDeliveryRecipientEntity, setDeliveryId, setEmail, setUserId, getDeliveryId (+1) |

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
| `BoardCardAssigneeEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardAssigneeEntity.java` | 8 |
| `BoardCardCommentEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | 10 |
| `BoardChecklistEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | 8 |
| `BoardChecklistItemEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | 9 |
| `BoardCardInboxEmailSender` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java` | 17 |
| `login` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 46 |
| `me` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 119 |
| `refresh` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 114 |
| `addComment` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 90 |
| `createCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 55 |
| `createColumn` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 35 |
| `deleteCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 70 |
| `deleteColumn` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 45 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → ApiException` | cross_community | 7 |
| `CreateFolder → ApiException` | cross_community | 7 |
| `CreateConversation → ApiException` | cross_community | 7 |
| `CreatePlan → ApiException` | cross_community | 7 |
| `ListFiles → ApiException` | cross_community | 7 |
| `ListPendingInvites → ApiException` | cross_community | 7 |
| `DeleteAccount → ApiException` | cross_community | 7 |
| `StartGmailIntegration → ApiException` | cross_community | 7 |
| `UpdateEvent → ApiException` | cross_community | 7 |
| `DeleteEvent → ApiException` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 62 calls |
| Plans | 8 calls |
| Persistence | 7 calls |
| Api | 5 calls |
| Blocks | 4 calls |
| Calendar | 3 calls |
| Intelligence | 2 calls |

## How to Explore

1. `context({name: "BoardCardInboxDeliveryEntity"})` — see callers and callees
2. `query({search_query: "board"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
