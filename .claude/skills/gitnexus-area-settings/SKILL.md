---
name: gitnexus-area-settings
description: "Skill for the Settings area of plan-things-2. 430 symbols across 96 files."
---

# Settings

430 symbols | 96 files | Cohesion: 71%

## When to Use

- Working with code in `services/`
- Understanding how GmailConnectionEntity, GitHubOAuthStateEntity, GmailOAuthStateEntity work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | attachmentMap, boardAssigneeMap, boardCardMap, boardChecklistMap, boardColumnMap (+20) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | accountSettingsFor, changePassword, getAccountAvatar, removeAccountAvatar, setupOAuthPassword (+15) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | exportSettingsData, getAccountAvatar, changePassword, deleteAccount, disconnectGitHubIntegration (+14) |
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | applyRestoreRecursively, applySoftDeleteRecursively, canAccessFile, collectSubtree, delete (+13) |
| `services/api/src/main/java/com/planthings/api/settings/GitHubConnectionEntity.java` | GitHubConnectionEntity, setConnectedAt, setEncryptedAccessToken, setGithubAvatarUrl, setGithubLogin (+12) |
| `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | GmailConnectionEntity, setConnectedAt, setEmail, setEncryptedRefreshToken, setLastCheckedAt (+10) |
| `services/api/src/main/java/com/planthings/api/settings/GitHubIntegrationService.java` | disconnectGitHub, disconnectGitHubWrapped, randomToken, startAuthorization, saveConnection (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | validateGmailIdentity, rememberLastError, saveConnection, randomToken, startAuthorization (+9) |
| `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | setDateFormat, setTheme, setTimeFormat, isDeadlineAlerts, isEmailNotifs (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | GmailOAuthStateEntity, setClient, setExpiresAt, setNonce, setRedirectPath (+9) |

## Entry Points

Start here when exploring this area:

- **`GmailConnectionEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java:9`
- **`GitHubOAuthStateEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GitHubOAuthStateEntity.java:9`
- **`GmailOAuthStateEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java:9`
- **`GitHubConnectionEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GitHubConnectionEntity.java:9`
- **`DefaultGmailOAuthClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java:18`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GmailConnectionEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 9 |
| `GitHubOAuthStateEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GitHubOAuthStateEntity.java` | 9 |
| `GmailOAuthStateEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | 9 |
| `GitHubConnectionEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GitHubConnectionEntity.java` | 9 |
| `DefaultGmailOAuthClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java` | 18 |
| `UserSettingsEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | 8 |
| `GmailPlanInviteEmailSender` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java` | 12 |
| `GmailOAuthClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthClient.java` | 4 |
| `PlanInviteEmailSender` | Interface | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | 5 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 216 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 211 |
| `login` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 99 |
| `refreshSession` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 145 |
| `sessionForUserId` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 136 |
| `toUserSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 221 |
| `toWorkspaceSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 235 |
| `getEmail` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 37 |
| `getFullName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 29 |
| `getLocaleTag` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 61 |
| `getPasswordHash` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 45 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DisconnectGitHubIntegration → ApiException` | cross_community | 8 |
| `CreateEvent → ApiException` | cross_community | 7 |
| `CreateFolder → ApiException` | cross_community | 7 |
| `CreateConversation → ApiException` | cross_community | 7 |
| `CreatePlan → ApiException` | cross_community | 7 |
| `ListFiles → ApiException` | cross_community | 7 |
| `DeleteAccount → ApiException` | cross_community | 7 |
| `StartGmailIntegration → ApiException` | cross_community | 7 |
| `StartGitHubIntegration → ApiException` | cross_community | 7 |
| `SearchGitHubRepositories → ApiException` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Board | 33 calls |
| Github | 15 calls |
| Plans | 12 calls |
| Auth | 10 calls |
| Files | 6 calls |
| Avatar | 5 calls |
| Tools | 4 calls |
| Calendar | 3 calls |

## How to Explore

1. `context({name: "GmailConnectionEntity"})` — see callers and callees
2. `query({search_query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
