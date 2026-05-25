---
name: auth
description: "Skill for the Auth area of plan-things-2. 185 symbols across 37 files."
---

# Auth

185 symbols | 37 files | Cohesion: 69%

## When to Use

- Working with code in `services/`
- Understanding how handleSaveAccount, handleSavePassword, startOAuthLogin work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/auth/OAuthProperties.java` | getProviders, getClientId, getClientSecret, getAuthorizationUri, getTokenUri (+15) |
| `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | register, createExternalUser, normalizeName, resetPassword, validatePassword (+12) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginCodeEntity.java` | OAuthLoginCodeEntity, getCompletionCode, setCompletionCode, setUserId, getRedirectPath (+8) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | getRedirectPath, OAuthLoginStateEntity, setStateToken, setProvider, setNonce (+8) |
| `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | exchangeAuthorizationCode, decodeIdToken, validateCommonClaims, microsoftIdentity, required (+7) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java` | requireProviderConfig, sanitizeRedirectPath, createCompletionCode, randomToken, start (+7) |
| `services/api/src/test/java/com/planthings/api/auth/DefaultOidcProviderClientTest.java` | shouldValidateGoogleIdTokenClaimsAndSignature, shouldRejectInvalidNonce, shouldRejectInvalidAudience, shouldRejectExpiredToken, shouldParseMicrosoftTenantObjectAndVerifiedPrimaryEmail (+7) |
| `services/api/src/main/java/com/planthings/api/auth/PasswordResetTokenEntity.java` | getUserId, getExpiresAt, getUsedAt, setUsedAt, PasswordResetTokenEntity (+4) |
| `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | getUserId, UserExternalIdentityEntity, setUserId, setProvider, setProviderSubject (+4) |
| `services/api/src/main/java/com/planthings/api/auth/UserSessionEntity.java` | UserSessionEntity, setUserId, getClient, setClient, setDeviceLabel (+2) |

## Entry Points

Start here when exploring this area:

- **`handleSaveAccount`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:852`
- **`handleSavePassword`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:960`
- **`startOAuthLogin`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:614`
- **`useAuth`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:722`
- **`Auth`** (Function) — `apps/web/src/features/auth/pages/Auth/Auth.jsx:83`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `UserSessionEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserSessionEntity.java` | 9 |
| `UserEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 7 |
| `OAuthLoginCodeEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginCodeEntity.java` | 9 |
| `OAuthLoginStateEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | 8 |
| `PasswordResetTokenEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/PasswordResetTokenEntity.java` | 9 |
| `UserExternalIdentityEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 8 |
| `DefaultOidcProviderClient` | Class | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 19 |
| `handleSaveAccount` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 852 |
| `handleSavePassword` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 960 |
| `startOAuthLogin` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 614 |
| `useAuth` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 722 |
| `Auth` | Function | `apps/web/src/features/auth/pages/Auth/Auth.jsx` | 83 |
| `handleOAuth` | Function | `apps/web/src/features/auth/pages/Auth/Auth.jsx` | 140 |
| `PasswordRecovery` | Function | `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx` | 17 |
| `persistAuthIntent` | Function | `apps/web/src/features/auth/utils/authIntent.js` | 2 |
| `OidcProviderClient` | Interface | `services/api/src/main/java/com/planthings/api/auth/OidcProviderClient.java` | 2 |
| `exchangeAuthorizationCode` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 48 |
| `decodeIdToken` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 68 |
| `validateCommonClaims` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 78 |
| `requireProviderConfig` | Method | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java` | 182 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ListActiveSessions → GetClient` | cross_community | 5 |
| `CreateMessage → HasText` | cross_community | 4 |
| `CreateCompletionCode → BadRequestException` | cross_community | 4 |
| `Register → BadRequestException` | intra_community | 4 |
| `Login → BadRequestException` | cross_community | 4 |
| `ForgotPassword → BadRequestException` | cross_community | 4 |
| `ResetPassword → BadRequestException` | intra_community | 4 |
| `StartOAuth → BadRequestException` | cross_community | 4 |
| `StartOAuth → GetProviders` | cross_community | 4 |
| `StartOAuth → HasText` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 21 calls |
| SettingsPage | 5 calls |
| Error | 4 calls |
| Context | 3 calls |
| OAuthCallback | 1 calls |
| Api | 1 calls |
| Url | 1 calls |
| Security | 1 calls |

## How to Explore

1. `gitnexus_context({name: "handleSaveAccount"})` — see callers and callees
2. `gitnexus_query({query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
