---
name: gitnexus-area-auth
description: "Skill for the Auth area of plan-things-2. 167 symbols across 31 files."
---

# Auth

167 symbols | 31 files | Cohesion: 74%

## When to Use

- Working with code in `services/`
- Understanding how Auth, BrandTypewriter, handleOAuth work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | createExternalUser, normalizeName, register, loginAndLinkExternalIdentity, requireTrustedAutoLink (+12) |
| `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | exchangeAuthorizationCode, exchangeCode, normalizeProvider, verifyIdToken, decodeIdToken (+9) |
| `services/api/src/test/java/com/planthings/api/auth/DefaultOidcProviderClientTest.java` | baseUrl, providerConfig, shouldParseMicrosoftTenantObjectAndVerifiedPrimaryEmail, shouldRejectExpiredToken, shouldRejectInvalidAudience (+8) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginCodeEntity.java` | OAuthLoginCodeEntity, getCompletionCode, getRedirectPath, setClient, setCompletionCode (+8) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | getRedirectPath, OAuthLoginStateEntity, setClient, setNonce, setProvider (+8) |
| `services/api/src/main/java/com/planthings/api/auth/OAuthLoginService.java` | createCompletionCode, randomToken, start, exchangeCompletionCode, consumeState (+7) |
| `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | UserExternalIdentityEntity, setProvider, setProviderSubject, setUserId, setAvatarUrl (+4) |
| `services/api/src/main/java/com/planthings/api/auth/PasswordResetTokenEntity.java` | PasswordResetTokenEntity, getExpiresAt, getToken, setExpiresAt, setToken (+4) |
| `services/api/src/main/java/com/planthings/api/auth/UserSessionService.java` | createSession, describeBrowser, describePlatform, normalizeClient, normalizeUserAgent (+3) |
| `services/api/src/main/java/com/planthings/api/auth/AuthController.java` | startOAuth, register, forgotPassword, exchangeOAuthCode, logout (+3) |

## Entry Points

Start here when exploring this area:

- **`Auth`** (Function) — `apps/web/src/features/auth/pages/Auth/Auth.jsx:76`
- **`BrandTypewriter`** (Function) — `apps/web/src/features/auth/pages/Auth/BrandTypewriter.jsx:13`
- **`handleOAuth`** (Function) — `apps/web/src/features/auth/pages/Auth/Auth.jsx:133`
- **`persistAuthIntent`** (Function) — `apps/web/src/features/auth/utils/authIntent.js:2`
- **`getOAuthPopupPosition`** (Function) — `apps/web/src/features/auth/utils/oauthPopup.js:7`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `UserSessionEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserSessionEntity.java` | 9 |
| `OAuthLoginCodeEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginCodeEntity.java` | 9 |
| `OAuthLoginStateEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/OAuthLoginStateEntity.java` | 8 |
| `UserEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 7 |
| `UserExternalIdentityEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 8 |
| `PasswordResetTokenEntity` | Class | `services/api/src/main/java/com/planthings/api/auth/PasswordResetTokenEntity.java` | 9 |
| `DefaultOidcProviderClient` | Class | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 19 |
| `Auth` | Function | `apps/web/src/features/auth/pages/Auth/Auth.jsx` | 76 |
| `BrandTypewriter` | Function | `apps/web/src/features/auth/pages/Auth/BrandTypewriter.jsx` | 13 |
| `handleOAuth` | Function | `apps/web/src/features/auth/pages/Auth/Auth.jsx` | 133 |
| `persistAuthIntent` | Function | `apps/web/src/features/auth/utils/authIntent.js` | 2 |
| `getOAuthPopupPosition` | Function | `apps/web/src/features/auth/utils/oauthPopup.js` | 7 |
| `openOAuthPopup` | Function | `apps/web/src/features/auth/utils/oauthPopup.js` | 19 |
| `waitForOAuthPopup` | Function | `apps/web/src/features/auth/utils/oauthPopup.js` | 58 |
| `OidcProviderClient` | Interface | `services/api/src/main/java/com/planthings/api/auth/OidcProviderClient.java` | 2 |
| `exchangeAuthorizationCode` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 66 |
| `exchangeCode` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 29 |
| `normalizeProvider` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 154 |
| `verifyIdToken` | Method | `services/api/src/main/java/com/planthings/api/auth/DefaultOidcProviderClient.java` | 41 |
| `getClient` | Method | `services/api/src/main/java/com/planthings/api/auth/UserSessionEntity.java` | 39 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NativeOAuth → ApiException` | cross_community | 8 |
| `HandleOAuth → NormalizePathname` | cross_community | 7 |
| `Logout → ApiException` | cross_community | 6 |
| `CreateCompletionCode → ApiException` | cross_community | 5 |
| `ListActiveSessions → GetClient` | cross_community | 5 |
| `NativeOAuth → NormalizeProvider` | cross_community | 4 |
| `NativeOAuth → FindByProviderAndProviderSubject` | cross_community | 4 |
| `Logout → GetUserId` | cross_community | 4 |
| `Logout → GetSessionId` | cross_community | 4 |
| `Logout → RevokeOne` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 27 calls |
| Hooks | 3 calls |
| Context | 3 calls |
| Board | 2 calls |
| Api | 1 calls |
| Url | 1 calls |
| Security | 1 calls |
| SidebarAccountMenu | 1 calls |

## How to Explore

1. `context({name: "Auth"})` — see callers and callees
2. `query({search_query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
