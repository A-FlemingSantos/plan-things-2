---
name: plans
description: "Skill for the Plans area of plan-things-2. 68 symbols across 15 files."
---

# Plans

68 symbols | 15 files | Cohesion: 57%

## When to Use

- Working with code in `services/`
- Understanding how PlanInviteEntity, PlanLabelEntity, PlanMemberEntity work
- Modifying plans-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | inviteMember, normalizeEmail, buildInviteUrl, getInvitePreview, declineInvite (+12) |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | PlanInviteEntity, setPlanId, setInviterUserId, setInvitedEmail, setToken (+7) |
| `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | inviteMember, getInvite, declineInvite, createLabel, acceptInvite (+4) |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | setCoverThemeId, setCoverColor, setCoverImageId, PlanEntity, setWorkspaceId (+3) |
| `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | PlanLabelEntity, setPlanId, getName, setName, getColor (+1) |
| `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | PlanMemberEntity, setPlanId, setUserId, setRole |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | sendInvite, PlanInviteEmailSender |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | findByPlanIdAndInvitedEmailIgnoreCaseAndStatus, findByToken |
| `services/api/src/main/java/com/planthings/api/plans/PlanMemberRepository.java` | existsByPlanIdAndUserId, findByPlanIdAndUserId |
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | createLabel |

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
| `inviteMember` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 72 |
| `sendInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | 7 |
| `setPlanId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 41 |
| `setInviterUserId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 49 |
| `setInvitedEmail` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 57 |
| `setToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 65 |
| `setExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 81 |
| `findByPlanIdAndInvitedEmailIgnoreCaseAndStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 15 |
| `existsByPlanIdAndUserId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanMemberRepository.java` | 15 |
| `inviteMember` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 171 |
| `normalizeEmail` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 520 |
| `buildInviteUrl` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 539 |
| `getInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 87 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 102 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreatePlan → UnauthorizedException` | cross_community | 6 |
| `InviteMember → UnauthorizedException` | cross_community | 6 |
| `InviteMember → FindByPlanIdAndUserId` | cross_community | 6 |
| `InviteMember → ForbiddenException` | cross_community | 6 |
| `ListInvites → FindByPlanIdAndUserId` | cross_community | 6 |
| `ListInvites → ForbiddenException` | cross_community | 6 |
| `RevokeInvite → FindByPlanIdAndUserId` | cross_community | 6 |
| `RevokeInvite → ForbiddenException` | cross_community | 6 |
| `AcceptInvite → UnauthorizedException` | cross_community | 6 |
| `DeclineInvite → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 30 calls |
| Settings | 10 calls |
| InviteAccept | 5 calls |
| Board | 2 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "PlanInviteEntity"})` — see callers and callees
2. `gitnexus_query({query: "plans"})` — find related execution flows
3. Read key files listed above for implementation details
