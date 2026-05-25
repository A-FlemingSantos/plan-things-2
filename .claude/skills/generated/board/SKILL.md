---
name: board
description: "Skill for the Board area of plan-things-2. 169 symbols across 35 files."
---

# Board

169 symbols | 35 files | Cohesion: 53%

## When to Use

- Working with code in `services/`
- Understanding how BoardCardInboxDeliveryEntity, BoardCardInboxDeliveryRecipientEntity, BaseEntity work
- Modifying board-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | getBoard, deleteColumn, updateCard, moveCard, deleteCard (+30) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | getPlanId, getColumnId, setColumnId, setPositionIndex, getAuthorUserId (+17) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | getTitle, getCompleted, getAssigneeUserId, getStartAt, getDueAt (+10) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | BoardCardInboxDeliveryEntity, setPlanId, setCardId, setSentByUserId, setSentFrom (+8) |
| `services/api/src/main/java/com/planthings/api/board/BoardController.java` | getBoard, moveCard, deleteCard, createChecklist, createChecklistItem (+5) |
| `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | getCardId, BoardChecklistEntity, setCardId, setTitle, setPositionIndex (+2) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | BoardCardInboxDeliveryRecipientEntity, setDeliveryId, setUserId, setEmail, getUserId (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | BoardColumnEntity, setPlanId, setTitle, setPositionIndex, setColor |
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | removeAttachment, unshareFromPlan, requireCardPlanContext, canManagePlanFiles |
| `services/api/src/main/java/com/planthings/api/plans/PlanAccessService.java` | requirePlanMember, requirePlanManager, requireMember, requireMemberRole |

## Entry Points

Start here when exploring this area:

- **`BoardCardInboxDeliveryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java:8`
- **`BoardCardInboxDeliveryRecipientEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java:8`
- **`BaseEntity`** (Class) — `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java:11`
- **`AiMessageBlockEntity`** (Class) — `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java:12`
- **`BoardCardEntity`** (Class) — `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BoardCardInboxDeliveryEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | 8 |
| `BoardCardInboxDeliveryRecipientEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryRecipientEntity.java` | 8 |
| `BaseEntity` | Class | `services/api/src/main/java/com/planthings/api/common/persistence/BaseEntity.java` | 11 |
| `AiMessageBlockEntity` | Class | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java` | 12 |
| `BoardCardEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 9 |
| `BoardCardAssigneeEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardAssigneeEntity.java` | 8 |
| `BoardChecklistEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | 8 |
| `BoardChecklistItemEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardChecklistItemEntity.java` | 9 |
| `BoardColumnEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 8 |
| `BoardCardCommentEntity` | Class | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | 8 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 46 |
| `getColumnId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 54 |
| `setColumnId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 58 |
| `setPositionIndex` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | 98 |
| `findByColumnIdOrderByPositionIndexAsc` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | 11 |
| `findByIdAndPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | 13 |
| `getCardId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardChecklistEntity.java` | 21 |
| `getBoard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 30 |
| `moveCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 65 |
| `deleteCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 70 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → UnauthorizedException` | cross_community | 6 |
| `CreateFolder → UnauthorizedException` | cross_community | 6 |
| `CreateConversation → UnauthorizedException` | cross_community | 6 |
| `CreateMessage → UnauthorizedException` | cross_community | 6 |
| `CreatePlan → UnauthorizedException` | cross_community | 6 |
| `SendCardToInbox → UnauthorizedException` | cross_community | 6 |
| `ListEvents → UnauthorizedException` | cross_community | 6 |
| `ListFiles → UnauthorizedException` | cross_community | 6 |
| `Upload → UnauthorizedException` | cross_community | 6 |
| `UploadAndAttachToCard → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 78 calls |
| Calendar | 8 calls |
| Plans | 5 calls |
| Screens | 2 calls |
| InviteAccept | 1 calls |
| Settings | 1 calls |
| Persistence | 1 calls |
| Api | 1 calls |

## How to Explore

1. `gitnexus_context({name: "BoardCardInboxDeliveryEntity"})` — see callers and callees
2. `gitnexus_query({query: "board"})` — find related execution flows
3. Read key files listed above for implementation details
