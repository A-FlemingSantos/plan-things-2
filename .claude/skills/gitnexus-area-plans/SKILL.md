---
name: gitnexus-area-plans
description: "Skill for the Plans area of plan-things-2. 73 symbols across 16 files."
---

# Plans

73 symbols | 16 files | Cohesion: 60%

## When to Use

- Working with code in `services/`
- Understanding how PlanInviteEntity, PlanLabelEntity, requirePlanManager work
- Modifying plans-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | acceptInvite, declineInvite, getInvitePreview, listInvites, listPendingInvitesForCurrentUser (+14) |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | getExpiresAt, getInvitedEmail, getPlanId, getStatus, getToken (+8) |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | getCoverColor, getCoverImageId, getCoverThemeId, getDescription, getName (+6) |
| `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | acceptInvite, declineInvite, getInvite, listInvites, listPendingInvites (+5) |
| `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | PlanLabelEntity, setColor, setName, setPlanId |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc, findByToken, findByPlanIdAndInvitedEmailIgnoreCaseAndStatus |
| `services/api/src/main/java/com/planthings/api/plans/PlanMemberRepository.java` | existsByPlanIdAndUserId, findByPlanIdAndUserId, findByPlanId |
| `services/api/src/main/java/com/planthings/api/plans/PlanAccessService.java` | requirePlanManager, requireMember |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | sendInvite |
| `services/api/src/main/java/com/planthings/api/board/BoardCardRepository.java` | countByPlanId |

## Entry Points

Start here when exploring this area:

- **`PlanInviteEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java:11`
- **`PlanLabelEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java:8`
- **`requirePlanManager`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanAccessService.java:29`
- **`acceptInvite`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanController.java:97`
- **`declineInvite`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanController.java:102`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PlanInviteEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 11 |
| `PlanLabelEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | 8 |
| `requirePlanManager` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanAccessService.java` | 29 |
| `acceptInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 97 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 102 |
| `getInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 87 |
| `listInvites` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 77 |
| `listPendingInvites` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 82 |
| `revokeInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 92 |
| `getExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 77 |
| `getInvitedEmail` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 53 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 37 |
| `getStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 69 |
| `getToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 61 |
| `setRespondedAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 89 |
| `setStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 73 |
| `findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 11 |
| `findByToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 13 |
| `acceptInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 242 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 359 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ListPendingInvites → ApiException` | cross_community | 7 |
| `InviteMember → ApiException` | cross_community | 7 |
| `RevokeInvite → ApiException` | cross_community | 7 |
| `AcceptInvite → ApiException` | cross_community | 7 |
| `DeclineInvite → ApiException` | cross_community | 7 |
| `CreateLabel → ApiException` | cross_community | 6 |
| `InviteMember → FindByPlanIdAndUserId` | cross_community | 6 |
| `ListInvites → ApiException` | cross_community | 6 |
| `RevokeInvite → FindByPlanIdAndUserId` | cross_community | 6 |
| `ListPendingInvites → GetUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 30 calls |
| Board | 23 calls |
| Api | 5 calls |
| Tools | 2 calls |
| Auth | 1 calls |
| Persistence | 1 calls |
| Blocks | 1 calls |

## How to Explore

1. `context({name: "PlanInviteEntity"})` — see callers and callees
2. `query({search_query: "plans"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
