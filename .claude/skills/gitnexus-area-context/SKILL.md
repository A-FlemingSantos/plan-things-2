---
name: gitnexus-area-context
description: "Skill for the Context area of plan-things-2. 132 symbols across 26 files."
---

# Context

132 symbols | 26 files | Cohesion: 68%

## When to Use

- Working with code in `apps/`
- Understanding how formatClockTime, formatClockTimeWithPreferences, formatCompactDayMonth work
- Modifying context-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | capitalizeFirst, formatClockTime, formatClockTimeWithPreferences, formatCompactDayMonth, formatCompactDayMonthWithPreferences (+39) |
| `apps/web/src/features/auth/context/AuthContext.jsx` | activateStoredAccount, clearPendingAccountRedirect, createEmptyAccountStore, getAccountId, normalizeAccountStore (+36) |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | createPlan, ensureInteractiveSession, renamePlan, setPlanById, updatePlan (+6) |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleNotificationToggle, persistNotifications, handleGeneralFieldChange, persistGeneralPreferences |
| `apps/web/src/features/auth/context/AuthContext.test.jsx` | createAccessToken, toBase64Url, readActiveStoredSession, readStoredValue |
| `apps/web/src/features/auth/utils/authRedirect.js` | resolveAccountHomeRoute, resolvePostAuthRoute |
| `apps/web/src/shared/context/AppChromeContext.jsx` | registerLoadingScreen, useAppChrome |
| `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx` | completeLogin, finishPopupOAuth |
| `apps/web/src/features/auth/utils/oauthPopup.js` | isOAuthPopupContext, postOAuthPopupResult |
| `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx` | submitForgot, submitReset |

## Entry Points

Start here when exploring this area:

- **`formatClockTime`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:659`
- **`formatClockTimeWithPreferences`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:309`
- **`formatCompactDayMonth`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:671`
- **`formatCompactDayMonthWithPreferences`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:350`
- **`formatDate`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:651`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatClockTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 659 |
| `formatClockTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 309 |
| `formatCompactDayMonth` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 671 |
| `formatCompactDayMonthWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 350 |
| `formatDate` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 651 |
| `formatDateTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 663 |
| `formatDateTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 329 |
| `formatDateWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 268 |
| `formatIntl` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 642 |
| `formatMonthLabel` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 667 |
| `formatMonthLabelWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 337 |
| `formatTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 655 |
| `formatTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 296 |
| `clearPendingAccountRedirect` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 305 |
| `patchSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 485 |
| `saveAuthenticatedSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 335 |
| `savedAccounts` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 689 |
| `switchAccount` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 504 |
| `bootstrap` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 368 |
| `clearPendingLogoutRedirect` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 301 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleSubmit → GetAccountId` | cross_community | 5 |
| `HandleSubmit → FetchImpl` | cross_community | 5 |
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `HandleSubmit → ApiClientError` | cross_community | 5 |
| `HandleSubmit → BuildDemoAccountKey` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 20 calls |
| Contracts | 7 calls |
| Config | 5 calls |
| Hooks | 3 calls |
| SidebarAccountMenu | 1 calls |
| PlanGitHubIntegrationModal | 1 calls |
| Data | 1 calls |

## How to Explore

1. `context({name: "formatClockTime"})` — see callers and callees
2. `query({search_query: "context"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
