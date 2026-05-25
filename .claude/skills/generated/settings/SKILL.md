---
name: settings
description: "Skill for the Settings area of plan-things-2. 125 symbols across 26 files."
---

# Settings

125 symbols | 26 files | Cohesion: 64%

## When to Use

- Working with code in `services/`
- Understanding how GmailConnectionEntity, GmailOAuthStateEntity, DefaultGmailOAuthClient work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | GmailConnectionEntity, setUserId, setEmail, setScopes, setEncryptedRefreshToken (+10) |
| `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | GmailOAuthStateEntity, setUserId, setStateToken, setNonce, setClient (+9) |
| `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | setTheme, setDateFormat, setTimeFormat, isEmailNotifs, isEventReminders (+9) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | saveConnection, rememberLastError, startAuthorization, randomToken, completeProviderCallback (+7) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | updatePreferences, resolveTheme, requireTheme, getSettingsSnapshot, requireFullName (+7) |
| `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationProperties.java` | getStateMinutes, getRedirectUri, getScopes, getWebReturnUrl, getMobileReturnUrl (+1) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | startGmailIntegration, updatePreferences, gmailCallback, getSettingsSnapshot, updateNotifications (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java` | sendCard, buildCardMime, kindLabel, emptyDash, renderCardInboxTemplate |
| `services/api/src/main/java/com/planthings/api/settings/GmailMimeSupport.java` | encodeMimeMessage, encodedHeader, encodedBody, headerValue, htmlEscape |
| `services/api/src/main/java/com/planthings/api/settings/DefaultGmailApiClient.java` | sendMessage, mapSendFailure, googleErrorReason, googleErrorMessage, googleError |

## Entry Points

Start here when exploring this area:

- **`GmailConnectionEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java:9`
- **`GmailOAuthStateEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java:9`
- **`DefaultGmailOAuthClient`** (Class) — `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java:18`
- **`UserSettingsEntity`** (Class) — `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java:8`
- **`setUserId`** (Method) — `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java:39`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GmailConnectionEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 9 |
| `GmailOAuthStateEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthStateEntity.java` | 9 |
| `DefaultGmailOAuthClient` | Class | `services/api/src/main/java/com/planthings/api/settings/DefaultGmailOAuthClient.java` | 18 |
| `UserSettingsEntity` | Class | `services/api/src/main/java/com/planthings/api/settings/UserSettingsEntity.java` | 8 |
| `GmailOAuthClient` | Interface | `services/api/src/main/java/com/planthings/api/settings/GmailOAuthClient.java` | 4 |
| `setUserId` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 39 |
| `setEmail` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 47 |
| `setScopes` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 55 |
| `setEncryptedRefreshToken` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 63 |
| `setConnectedAt` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 71 |
| `setRevokedAt` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 79 |
| `setLastError` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 87 |
| `setLastCheckedAt` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionEntity.java` | 95 |
| `rememberLastError` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailConnectionStatusService.java` | 20 |
| `saveConnection` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | 194 |
| `rememberLastError` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailIntegrationService.java` | 208 |
| `encrypt` | Method | `services/api/src/main/java/com/planthings/api/settings/IntegrationTokenCipher.java` | 28 |
| `sendCard` | Method | `services/api/src/main/java/com/planthings/api/board/BoardCardInboxEmailSender.java` | 36 |
| `refreshAccessToken` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailApiClient.java` | 6 |
| `sendMessage` | Method | `services/api/src/main/java/com/planthings/api/settings/GmailApiClient.java` | 8 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `StartGmailIntegration → UnauthorizedException` | cross_community | 6 |
| `StartGmailIntegration → GetProviders` | cross_community | 4 |
| `StartGmailIntegration → HasText` | cross_community | 4 |
| `StartGmailIntegration → GetClientId` | cross_community | 4 |
| `StartGmailIntegration → GetClientSecret` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 31 calls |
| Auth | 16 calls |
| Board | 4 calls |
| Error | 4 calls |
| Url | 1 calls |

## How to Explore

1. `gitnexus_context({name: "GmailConnectionEntity"})` — see callers and callees
2. `gitnexus_query({query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
