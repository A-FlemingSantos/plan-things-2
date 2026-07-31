---
name: gitnexus-area-settings
description: "Skill for the Settings area of plan-things-2. 134 symbols across 29 files."
---

# Settings

134 symbols | 29 files | Cohesion: 70%

## When to Use

- Working with code in `services/`
- Understanding how GmailConnectionEntity, GmailOAuthStateEntity, DefaultGmailOAuthClient work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | GmailConnectionEntity, setConnectedAt, setEmail, setEncryptedRefreshToken, setLastCheckedAt (+10) |
| `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | setDateFormat, setTheme, setTimeFormat, isDeadlineAlerts, isEmailNotifs (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | GmailOAuthStateEntity, setClient, setExpiresAt, setNonce, setRedirectPath (+9) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | normalizeRequired, requireDateFormat, requireFullName, requireLocale, requireTheme (+8) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | rememberLastError, saveConnection, randomToken, startAuthorization, completeProviderCallback (+8) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | updateAccount, updatePreferences, startGmailIntegration, gmailCallback, getSettingsSnapshot (+2) |
| `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java` | refreshAccessToken, googleError, googleErrorMessage, googleErrorReason, mapSendFailure (+1) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java` | getStateMinutes, getRedirectUri, getScopes, getMobileReturnUrl, getMobileWebReturnUrl (+1) |
| `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java` | DefaultGmailOAuthClient, decodeIdToken, exchangeAuthorizationCode, exchangeCode, validateGoogleClaims |
| `services/api/src/main/java/com/planthings/api/settings/GmailMimeSupport.java` | encodedBody, encodedHeader, headerValue, htmlEscape |

## Entry Points

Start here when exploring this area:

- **`GmailConnectionEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java:9`
- **`GmailOAuthStateEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java:9`
- **`DefaultGmailOAuthClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java:18`
- **`UserSettingsEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java:8`
- **`GmailPlanInviteEmailSender`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GmailConnectionEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 9 |
| `GmailOAuthStateEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | 9 |
| `DefaultGmailOAuthClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java` | 18 |
| `UserSettingsEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | 8 |
| `GmailPlanInviteEmailSender` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailPlanInviteEmailSender.java` | 12 |
| `GmailOAuthClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthClient.java` | 4 |
| `PlanInviteEmailSender` | Interface | `services/api/src/main/java/com/planthings/api/plans/PlanInviteEmailSender.java` | 5 |
| `setLocaleTag` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 65 |
| `setTimeZone` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 73 |
| `updateAccount` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | 55 |
| `updatePreferences` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | 79 |
| `normalizeRequired` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 315 |
| `requireDateFormat` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 279 |
| `requireFullName` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 231 |
| `requireLocale` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 239 |
| `requireTheme` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 308 |
| `requireTimeFormat` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 287 |
| `requireTimeZone` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 265 |
| `resolveTheme` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 295 |
| `updateAccount` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | 88 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `StartGmailIntegration → ApiException` | cross_community | 7 |
| `DisconnectGmailIntegration → ApiException` | cross_community | 7 |
| `UpdatePreferences → ApiException` | cross_community | 6 |
| `StartGmailIntegration → GetUserId` | cross_community | 5 |
| `DisconnectGmailIntegration → GetUserId` | cross_community | 5 |
| `DisconnectGmailIntegration → GetRevokedAt` | cross_community | 5 |
| `DisconnectGmailIntegration → GetLastError` | cross_community | 5 |
| `DisconnectGmailIntegration → GetEmail` | cross_community | 5 |
| `DisconnectGmailIntegration → GetScopes` | cross_community | 5 |
| `SendCardToInbox → FindByUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 21 calls |
| Board | 6 calls |
| Auth | 2 calls |
| Url | 1 calls |

## How to Explore

1. `context({name: "GmailConnectionEntity"})` — see callers and callees
2. `query({search_query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
