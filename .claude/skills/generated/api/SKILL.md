---
name: api
description: "Skill for the Api area of plan-things-2. 133 symbols across 23 files."
---

# Api

133 symbols | 23 files | Cohesion: 77%

## When to Use

- Working with code in `services/`
- Understanding how ApiIntegrationTestSupport, DefaultGmailApiClient, registerAndGetToken work
- Modifying api-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/test/java/com/planthings/api/OAuthApiIntegrationTest.java` | OAuthApiIntegrationTest, shouldRejectMicrosoftEmailAutoLinkWithoutStrongEmailProof, shouldRejectMissingOrUnverifiedOAuthEmail, shouldRejectInvalidOrExpiredState, shouldRejectStateReplay (+14) |
| `services/api/src/test/java/com/planthings/api/BoardInboxGmailIntegrationTest.java` | BoardInboxGmailIntegrationTest, shouldSendCardToNewManualMembersWithConnectedGmail, shouldSendCardToManualRecipientsWhenCardHasNoAssignees, shouldClearPersistedInboxDeliveries, shouldOnlySendCardToManualRecipientsNotAlreadyAssigned (+11) |
| `services/api/src/test/java/com/planthings/api/SettingsApiIntegrationTest.java` | shouldLoadAndUpdateSettingsSnapshot, shouldRejectPasswordSetupForPasswordOnlyAccount, shouldUpdateAccountWorkspaceAndPassword, shouldUploadServeAndRemoveAccountAvatar, shouldRejectInvalidAvatarPayloads (+8) |
| `services/api/src/test/java/com/planthings/api/GmailIntegrationApiIntegrationTest.java` | GmailIntegrationApiIntegrationTest, shouldStartGmailAuthorizationWithSendScopeAndOfflineAccess, shouldPreserveWebBackgroundRouteAcrossGmailCallback, shouldPreserveMobileReturnUrlWhenGmailAddressDiffers, shouldPreserveMobileReturnUrlWhenRefreshTokenIsMissing (+8) |
| `services/api/src/test/java/com/planthings/api/PlanInviteGmailIntegrationTest.java` | PlanInviteGmailIntegrationTest, shouldSendInviteWithConnectedGmailAndPersistPendingInvite, shouldRejectInviteWithoutConnectedGmailAndNotCreatePendingInvite, shouldRejectInviteWhenRefreshTokenFailsAndRememberLastError, shouldRejectInviteWhenGmailSendFailsAndNotCreatePendingInvite (+8) |
| `services/api/src/test/java/com/planthings/api/FileApiIntegrationTest.java` | shouldFavoriteAndUnfavoriteFiles, shouldDeleteAndRestoreFolderTreeRecursively, shouldPermanentlyDeleteTrashedFolderTreeRecursively, shouldUploadShareTrashAndRestoreFiles, shouldApplyPlanFileAttachmentPermissions (+6) |
| `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | registerAndGetToken, createPlan, createBoardColumn, readJson, ApiIntegrationTestSupport (+4) |
| `services/api/src/test/java/com/planthings/api/DatasourceSafetyGuardTest.java` | shouldAllowOfficialApplicationDatabaseOutsideTestProfile, shouldAllowOfficialApplicationDatabaseFromContainerHostOutsideTestProfile, shouldBlockInvalidDatabaseOutsideTestProfile, shouldBlockWhenDatabaseNameIsMissingOutsideTestProfile, shouldAllowAnyDatabaseDuringTestProfile (+1) |
| `services/api/src/test/java/com/planthings/api/PlanApiIntegrationTest.java` | shouldCreatePlansWithAnEmptyBoard, shouldAllowManagersToListAndRevokeInvitesAndAllowInviteAcceptanceToJoinPlans, shouldCreatePlanEvenWhenPersonalWorkspaceIsMissing, shouldExposeTaskCountInPlanSummaryList, PlanApiIntegrationTest |
| `services/api/src/test/java/com/planthings/api/IntelligenceApiIntegrationTest.java` | shouldCreateConversationAndAcceptMessage, shouldValidateCardScopeWhenCreatingConversation, createCard, IntelligenceApiIntegrationTest |

## Entry Points

Start here when exploring this area:

- **`ApiIntegrationTestSupport`** (Class) — `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java:23`
- **`DefaultGmailApiClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java:19`
- **`registerAndGetToken`** (Method) — `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java:120`
- **`createPlan`** (Method) — `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java:136`
- **`createBoardColumn`** (Method) — `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java:152`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiIntegrationTestSupport` | Class | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 23 |
| `DefaultGmailApiClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java` | 19 |
| `GmailApiClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailApiClient.java` | 4 |
| `registerAndGetToken` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 120 |
| `createPlan` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 136 |
| `createBoardColumn` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 152 |
| `readJson` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 174 |
| `setExpiresAt` | Method | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | 76 |
| `findByStateToken` | Method | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateRepository.java` | 12 |
| `getMessage` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardCommentEntity.java` | 37 |
| `postProcessEnvironment` | Method | `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyEnvironmentPostProcessor.java` | 9 |
| `validate` | Method | `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java` | 16 |
| `extractDatabaseName` | Method | `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java` | 44 |
| `isTestProfile` | Method | `services/api/src/main/java/com/planthings/api/config/DatasourceSafetyGuard.java` | 57 |
| `findByPlanIdOrderByCreatedAtDesc` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanInviteRepository.java` | 9 |
| `registerTestDatabaseProperties` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 39 |
| `ensureTestDatabaseExists` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 56 |
| `envOrDefault` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 95 |
| `requiredEnv` | Method | `services/api/src/test/java/com/planthings/api/ApiIntegrationTestSupport.java` | 100 |
| `AuthApiIntegrationTest` | Class | `services/api/src/test/java/com/planthings/api/AuthApiIntegrationTest.java` | 13 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 10 calls |
| Auth | 6 calls |
| Plans | 5 calls |
| Files | 2 calls |

## How to Explore

1. `gitnexus_context({name: "ApiIntegrationTestSupport"})` — see callers and callees
2. `gitnexus_query({query: "api"})` — find related execution flows
3. Read key files listed above for implementation details
