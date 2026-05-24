---
name: board
description: "Skill for the Board area of plan-things-2. 150 symbols across 26 files."
---

# Board

150 symbols | 26 files | Cohesion: 52%

## When to Use

- Working with code in `services/`
- Understanding how BoardCardEntity, BoardCardInboxDeliveryEntity, BoardCardInboxDeliveryRecipientEntity work
- Modifying board-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | toCardView, deriveCardKind, deleteColumn, moveCard, deleteCard (+32) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | getAuthorUserId, getTitle, getDescription, getLabelId, getPositionIndex (+17) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | getTitle, getCompleted, getAssigneeUserId, getStartAt, getDueAt (+10) |
| `services/api/src/main/java/com/planthings/api/board/BoardController.java` | deleteColumn, moveCard, deleteCard, sendCardToInbox, createColumn (+8) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | BoardCardInboxDeliveryEntity, setPlanId, setCardId, setSentByUserId, setSentFrom (+8) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | BoardChecklistEntity, setCardId, setTitle, setPositionIndex, getCardId (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | BoardCardInboxDeliveryRecipientEntity, setDeliveryId, setUserId, setEmail, getUserId (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | BoardColumnEntity, setPlanId, setTitle, setColor, setPositionIndex |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | boardCardMap, inboxDeliveryMap, boardChecklistItemMap |
| `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | findByColumnIdOrderByPositionIndexAsc, findByIdAndPlanId, findByPlanIdOrderByPositionIndexAsc |

## Entry Points

Start here when exploring this area:

- **`BoardCardEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java:9`
- **`BoardCardInboxDeliveryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java:8`
- **`BoardCardInboxDeliveryRecipientEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java:8`
- **`BaseEntity`** (Class) — `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java:11`
- **`BoardColumnEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BoardCardEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 9 |
| `BoardCardInboxDeliveryEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | 8 |
| `BoardCardInboxDeliveryRecipientEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | 8 |
| `BaseEntity` | Class | `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java` | 11 |
| `BoardColumnEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 8 |
| `BoardCardAssigneeEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardAssigneeEntity.java` | 8 |
| `BoardChecklistEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | 8 |
| `BoardChecklistItemEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | 9 |
| `BoardCardCommentEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | 8 |
| `findByCardIdOrderByCreatedAtAsc` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentRepository.java` | 8 |
| `getAuthorUserId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 62 |
| `getTitle` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 70 |
| `getDescription` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 78 |
| `getLabelId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 86 |
| `getPositionIndex` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 94 |
| `getCompleted` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 102 |
| `getStarred` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 110 |
| `getStartAt` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 118 |
| `getDueAt` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 126 |
| `toCardView` | Method | `services/api/src/main/java/com/planthings/api/board/BoardService.java` | 532 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SendCardToInbox → UnauthorizedException` | cross_community | 6 |
| `CreateCard → UnauthorizedException` | cross_community | 5 |
| `CreateColumn → UnauthorizedException` | cross_community | 5 |
| `CreateChecklist → UnauthorizedException` | cross_community | 5 |
| `CreateChecklistItem → UnauthorizedException` | cross_community | 5 |
| `UpdateCard → UnauthorizedException` | cross_community | 5 |
| `UpdateChecklistItem → UnauthorizedException` | cross_community | 5 |
| `AddComment → UnauthorizedException` | cross_community | 5 |
| `UploadAndAttachToCard → NotFoundException` | cross_community | 5 |
| `UploadAndAttachToCard → ExistsByPlanIdAndUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 72 calls |
| Settings | 14 calls |
| Calendar | 8 calls |
| Plans | 5 calls |
| Screens | 2 calls |
| InviteAccept | 1 calls |

## How to Explore

1. `gitnexus_context({name: "BoardCardEntity"})` — see callers and callees
2. `gitnexus_query({query: "board"})` — find related execution flows
3. Read key files listed above for implementation details
