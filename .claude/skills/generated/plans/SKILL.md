---
name: plans
description: "Skill for the Plans area of plan-things-2. 72 symbols across 16 files."
---

# Plans

72 symbols | 16 files | Cohesion: 63%

## When to Use

- Working with code in `services/`
- Understanding how PlanInviteEntity, PlanLabelEntity, PlanMemberEntity work
- Modifying plans-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | acceptInvite, listPendingInvitesForCurrentUser, getInvitePreview, revokeInvite, declineInvite (+12) |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | getPlanId, getInviterUserId, getInvitedEmail, getToken, getStatus (+10) |
| `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | listPendingInvites, getInvite, revokeInvite, acceptInvite, declineInvite (+4) |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | setCoverThemeId, setCoverColor, setCoverImageId, PlanEntity, setWorkspaceId (+3) |
| `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | PlanLabelEntity, setPlanId, getName, setName, setColor |
| `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | PlanMemberEntity, setPlanId, setUserId, setRole |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc, findByToken, findByPlanIdAndInvitedEmailIgnoreCaseAndStatus |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | sendInvite, PlanInviteEmailSender |
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | ensureDefaultLabels, createLabel |
| `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | getPlanId |

## Entry Points

Start here when exploring this area:

- **`PlanInviteEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java:11`
- **`PlanLabelEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java:8`
- **`PlanMemberEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java:10`
- **`PlanEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java:8`
- **`GmailPlanInviteEmailSender`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PlanInviteEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 11 |
| `PlanLabelEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | 8 |
| `PlanMemberEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | 10 |
| `PlanEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 8 |
| `GmailPlanInviteEmailSender` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java` | 12 |
| `PlanInviteEmailSender` | Interface | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | 5 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/board/BoardColumnEntity.java` | 24 |
| `listPendingInvites` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 82 |
| `getInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 87 |
| `revokeInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 92 |
| `acceptInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 97 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 102 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 37 |
| `getInviterUserId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 45 |
| `getInvitedEmail` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 53 |
| `getToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 61 |
| `getStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 69 |
| `setStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 73 |
| `getExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 77 |
| `getRespondedAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 85 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreatePlan → UnauthorizedException` | cross_community | 6 |
| `InviteMember → UnauthorizedException` | cross_community | 6 |
| `InviteMember → FindByPlanIdAndUserId` | cross_community | 6 |
| `InviteMember → ForbiddenException` | cross_community | 6 |
| `ListPendingInvites → UnauthorizedException` | cross_community | 6 |
| `RevokeInvite → FindByPlanIdAndUserId` | cross_community | 6 |
| `RevokeInvite → ForbiddenException` | cross_community | 6 |
| `AcceptInvite → UnauthorizedException` | cross_community | 6 |
| `DeclineInvite → UnauthorizedException` | cross_community | 6 |
| `CreatePlan → WorkspaceEntity` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 38 calls |
| Board | 8 calls |
| Auth | 1 calls |
| Settings | 1 calls |

## How to Explore

1. `gitnexus_context({name: "PlanInviteEntity"})` — see callers and callees
2. `gitnexus_query({query: "plans"})` — find related execution flows
3. Read key files listed above for implementation details
