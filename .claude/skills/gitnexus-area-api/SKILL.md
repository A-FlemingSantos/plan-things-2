---
name: gitnexus-area-api
description: "Skill for the Api area of plan-things-2. 179 symbols across 30 files."
---

# Api

179 symbols | 30 files | Cohesion: 76%

## When to Use

- Working with code in `services/`
- Understanding how PlanMemberEntity, ApiIntegrationTestSupport, DefaultGmailApiClient work
- Modifying api-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/test/java/com/planthings/api/OAuthApiIntegrationTest.java` | shouldCreateSessionFromNativeGoogleIdToken, OAuthApiIntegrationTest, completeProviderCallbackLocation, queryParam, shouldPreserveMobileCallbackWhenFailureHappensAfterStateConsumption (+15) |
| `services/api/src/test/java/com/planthings/api/BoardInboxGmailIntegrationTest.java` | BoardInboxGmailIntegrationTest, addMember, createCard, decodeBase64Part, register (+12) |
| `services/api/src/test/java/com/planthings/api/IntelligenceApiIntegrationTest.java` | createCard, shouldValidateCardScopeWhenCreatingConversation, IntelligenceApiIntegrationTest, functionCallNode, postMessage (+10) |
| `services/api/src/test/java/com/planthings/api/GitHubIntegrationApiIntegrationTest.java` | reset, addMember, connectGitHub, shouldLinkOnlyObjectsFromConnectedPlanRepository, shouldPromoteOldestEligibleAnchorOnRemoval (+8) |
| `services/api/src/test/java/com/planthings/api/PlanInviteGmailIntegrationTest.java` | decodeBase64Part, register, shouldKeepDuplicatePendingInviteConflict, shouldRejectInviteWhenGmailSendFailsAndNotCreatePendingInvite, shouldRejectInviteWhenRefreshTokenFailsAndRememberLastError (+8) |
| `services/api/src/test/java/com/planthings/api/SettingsApiIntegrationTest.java` | shouldCanonicalizeLocaleAndTimeZoneOnPreferencesUpdate, shouldDeleteAccountAfterStrongConfirmation, shouldExportSettingsDataAsZip, shouldListAndRevokeSpecificSession, shouldLoadAndUpdateSettingsSnapshot (+8) |
| `services/api/src/test/java/com/planthings/api/GmailIntegrationApiIntegrationTest.java` | GmailIntegrationApiIntegrationTest, queryParam, shouldPreserveMobileReturnUrlWhenGmailAddressDiffers, shouldPreserveMobileReturnUrlWhenRefreshTokenIsMissing, shouldPreserveWebBackgroundRouteAcrossGmailCallback (+8) |
| `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | createBoardColumn, createPlan, readJson, registerAndGetToken, ApiIntegrationTestSupport (+7) |
| `services/api/src/test/java/com/planthings/api/FileApiIntegrationTest.java` | addMember, assertAttachmentMissing, findAttachmentByFileId, shouldApplyPlanFileAttachmentPermissions, shouldRollbackAtomicUploadWhenCardIsInvalidOrInaccessible (+7) |
| `services/api/src/test/java/com/planthings/api/BoardAssigneeIntegrationTest.java` | shouldAllowAssigningMembersAndUpdatingDueDates, shouldPersistAssigneeActivityInCardComments, shouldPersistCompletedStateWithoutMovingCardToDoneColumn, shouldPersistStarredStateAcrossBoardReads, shouldRemoveLegacyCardAssignmentsWhenAMemberLeavesThePlan (+1) |

## Entry Points

Start here when exploring this area:

- **`PlanMemberEntity`** (Class) — `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java:10`
- **`ApiIntegrationTestSupport`** (Class) — `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java:23`
- **`DefaultGmailApiClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java:19`
- **`setOwnerUserId`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java:45`
- **`setWorkspaceId`** (Method) — `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java:37`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PlanMemberEntity` | Class | `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | 10 |
| `ApiIntegrationTestSupport` | Class | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 23 |
| `DefaultGmailApiClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java` | 19 |
| `GmailApiClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailApiClient.java` | 4 |
| `setOwnerUserId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 45 |
| `setWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | 37 |
| `findByPlanIdOrderByCreatedAtDesc` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 9 |
| `setPlanId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | 28 |
| `setRole` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | 44 |
| `setUserId` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanMemberEntity.java` | 36 |
| `createPlan` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | 119 |
| `createBoardColumn` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 152 |
| `createPlan` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 136 |
| `readJson` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 174 |
| `registerAndGetToken` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 120 |
| `createResponse` | Method | `services/api/src/main/java/com/planthings/api/intelligence/openai/AiOpenAiClient.java` | 8 |
| `createResponseStream` | Method | `services/api/src/main/java/com/planthings/api/intelligence/openai/AiOpenAiClient.java` | 10 |
| `createResponseStream` | Method | `services/api/src/main/java/com/planthings/api/intelligence/openai/DefaultAiOpenAiClient.java` | 65 |
| `findByMessageIdOrderByCreatedAtAsc` | Method | `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiToolCallRepository.java` | 8 |
| `setExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | 76 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreatePlan → ApiException` | cross_community | 7 |
| `CreatePlan → GetUserId` | cross_community | 5 |
| `CreatePlan → SetOwnerUserId` | cross_community | 5 |
| `CreatePlan → GetId` | cross_community | 5 |
| `CreatePlan → SetName` | cross_community | 5 |
| `CreatePlan → GetFullName` | cross_community | 5 |
| `CreatePlan → FindByOwnerUserId` | cross_community | 4 |
| `CreatePlan → SetWorkspaceId` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 16 calls |
| Plans | 5 calls |
| Auth | 3 calls |
| Openai | 2 calls |
| Board | 2 calls |
| Files | 1 calls |

## How to Explore

1. `context({name: "PlanMemberEntity"})` — see callers and callees
2. `query({search_query: "api"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
