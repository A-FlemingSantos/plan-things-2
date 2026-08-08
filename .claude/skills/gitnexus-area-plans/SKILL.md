---
name: gitnexus-area-plans
description: "Skill for the Plans area of plan-things-2. 70 symbols across 17 files."
---

# Plans

70 symbols | 17 files | Cohesion: 58%

## When to Use

- Working with code in `services/`
- Understanding how PlanInviteEntity, PlanLabelEntity, acceptInvite work
- Modifying plans-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | acceptInvite, declineInvite, getInvitePreview, toInvitePreviewResponse, toInviteResponse (+12) |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | getExpiresAt, getInvitedEmail, getPlanId, getStatus, getToken (+8) |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | getCoverColor, getCoverImageId, getCoverThemeId, getDescription, getName (+6) |
| `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | acceptInvite, declineInvite, getInvite, inviteMember, removeMember (+3) |
| `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | PlanLabelEntity, setColor, setName, setPlanId |
| `services/api/src/main/java/com/planthings/api/plans/PlanMemberRepository.java` | existsByPlanIdAndUserId, findByPlanIdAndUserId, findByPlanId |
| `services/api/src/main/java/com/planthings/api/plans/PlanAccessService.java` | requireMember, requireMemberRole, requirePlanManager |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | findByToken, findByPlanIdAndInvitedEmailIgnoreCaseAndStatus |
| `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | sendInvite |
| `services/api/src/main/java/com/planthings/api/board/BoardCardAssigneeRepository.java` | deleteByUserIdAndCardIdIn |

## Entry Points

Start here when exploring this area:

- **`PlanInviteEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java:11`
- **`PlanLabelEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java:8`
- **`acceptInvite`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanController.java:82`
- **`declineInvite`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanController.java:87`
- **`getInvite`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanController.java:77`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PlanInviteEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 11 |
| `PlanLabelEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanLabelEntity.java` | 8 |
| `acceptInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 82 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 87 |
| `getInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 77 |
| `getExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 77 |
| `getInvitedEmail` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 53 |
| `getPlanId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 37 |
| `getStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 69 |
| `getToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 61 |
| `setRespondedAt` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 89 |
| `setStatus` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEntity.java` | 73 |
| `findByToken` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 13 |
| `acceptInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 242 |
| `declineInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 294 |
| `getInvitePreview` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 276 |
| `toInvitePreviewResponse` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 442 |
| `toInviteResponse` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 431 |
| `inviteMember` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 72 |
| `sendInvite` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | 7 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `InviteMember → ApiException` | cross_community | 6 |
| `CreateLabel → ApiException` | cross_community | 6 |
| `AcceptInvite → ApiException` | cross_community | 6 |
| `ConnectRepository → FindByPlanIdAndUserId` | cross_community | 6 |
| `InviteMember → FindByPlanIdAndUserId` | cross_community | 5 |
| `ListConnectedRepositories → FindByPlanIdAndUserId` | cross_community | 5 |
| `ListPlanFiles → FindByPlanIdAndUserId` | cross_community | 5 |
| `UploadAndAttachToCard → FindByPlanIdAndUserId` | cross_community | 5 |
| `AttachToCard → FindByPlanIdAndUserId` | cross_community | 5 |
| `ConnectRepository → ExistsByPlanIdAndUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 36 calls |
| Board | 10 calls |
| Api | 5 calls |
| Auth | 1 calls |
| Persistence | 1 calls |
| Calendar | 1 calls |
| Blocks | 1 calls |
| Tools | 1 calls |

## How to Explore

1. `context({name: "PlanInviteEntity"})` — see callers and callees
2. `query({search_query: "plans"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
