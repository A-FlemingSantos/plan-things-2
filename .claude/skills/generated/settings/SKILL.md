---
name: settings
description: "Skill for the Settings area of plan-things-2. 155 symbols across 33 files."
---

# Settings

155 symbols | 33 files | Cohesion: 61%

## When to Use

- Working with code in `services/`
- Understanding how completed, GmailConnectionEntity, GmailOAuthStateEntity work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | GmailConnectionEntity, setUserId, setEmail, setScopes, setEncryptedRefreshToken (+10) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | updateAccount, uploadAccountAvatar, removeAccountAvatar, changePassword, setupOAuthPassword (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | GmailOAuthStateEntity, setUserId, setStateToken, setNonce, setClient (+9) |
| `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | setTheme, setDateFormat, setTimeFormat, isEmailNotifs, isEventReminders (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | saveConnection, rememberLastError, startAuthorization, randomToken, completeProviderCallback (+7) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | updatePreferences, resolveTheme, requireTheme, getSettingsSnapshot, requireFullName (+7) |
| `services/api/src/main/java/com/planthings/api/files/FileController.java` | upload, delete, permanentlyDelete, restore, favorite (+1) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java` | getStateMinutes, getRedirectUri, getScopes, getWebReturnUrl, getMobileReturnUrl (+1) |
| `services/api/src/main/java/com/planthings/api/workspace/WorkspaceController.java` | getCurrentWorkspace, updateCurrentWorkspaceSubscription, updateCurrentWorkspaceIcon, parseSubscriptionPlan, parseIconKey |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java` | sendCard, buildCardMime, kindLabel, emptyDash, renderCardInboxTemplate |

## Entry Points

Start here when exploring this area:

- **`completed`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js:75`
- **`GmailConnectionEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java:9`
- **`GmailOAuthStateEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java:9`
- **`DefaultGmailOAuthClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java:18`
- **`UserSettingsEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GmailConnectionEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 9 |
| `GmailOAuthStateEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | 9 |
| `DefaultGmailOAuthClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java` | 18 |
| `UserSettingsEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | 8 |
| `completed` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js` | 75 |
| `GmailOAuthClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthClient.java` | 4 |
| `login` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 46 |
| `refresh` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 100 |
| `me` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | 105 |
| `createCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 55 |
| `updateCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 60 |
| `updateChecklistItem` | Method | `services/api/src/main/java/com/planthings/api/board/BoardController.java` | 110 |
| `ok` | Method | `services/api/src/main/java/com/planthings/api/common/api/ApiEnvelope.java` | 8 |
| `upload` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 47 |
| `delete` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 66 |
| `permanentlyDelete` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 71 |
| `restore` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 76 |
| `favorite` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 81 |
| `unfavorite` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 86 |
| `listPlans` | Method | `services/api/src/main/java/com/planthings/api/plans/PlanController.java` | 29 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Upload → UnauthorizedException` | cross_community | 6 |
| `Restore → UnauthorizedException` | cross_community | 6 |
| `Favorite → UnauthorizedException` | cross_community | 6 |
| `Unfavorite → UnauthorizedException` | cross_community | 6 |
| `SetupOAuthPassword → UnauthorizedException` | cross_community | 6 |
| `DeleteAccount → UnauthorizedException` | cross_community | 6 |
| `StartGmailIntegration → UnauthorizedException` | cross_community | 6 |
| `Delete → UnauthorizedException` | cross_community | 6 |
| `PermanentlyDelete → UnauthorizedException` | cross_community | 6 |
| `RemoveAccountAvatar → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 49 calls |
| Auth | 16 calls |
| Board | 7 calls |
| Error | 4 calls |
| Url | 1 calls |

## How to Explore

1. `gitnexus_context({name: "completed"})` — see callers and callees
2. `gitnexus_query({query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
