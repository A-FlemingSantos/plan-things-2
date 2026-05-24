---
name: context
description: "Skill for the Context area of plan-things-2. 115 symbols across 18 files."
---

# Context

115 symbols | 18 files | Cohesion: 73%

## When to Use

- Working with code in `apps/`
- Understanding how saveAccountStore, clearPendingLogoutRedirect, clearPendingAccountRedirect work
- Modifying context-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/auth/context/AuthContext.jsx` | createEmptyAccountStore, getAccountId, normalizeSession, normalizeAccountStore, normalizeLegacySession (+35) |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | toDate, capitalizeFirst, normalizeShortMonthLabel, resolveFormattingPreferences, formatDateWithPreferences (+32) |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | PlansProvider, hydrateBackendPlans, setPlanById, ensureInteractiveSession, createPlan (+9) |
| `apps/web/src/features/auth/context/AuthContext.test.jsx` | createAccessToken, toBase64Url, readStoredValue, readActiveStoredSession |
| `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx` | submitForgot, submitReset |
| `apps/web/src/features/workspace/data/kanbanColorPalette.js` | normalizeKanbanAccentColor, isKanbanAccentBaseColor |
| `apps/web/src/App.jsx` | PreferredAppEntryRedirect, App |
| `apps/web/src/features/auth/utils/sessionMode.js` | readSessionModeFromAuthState, resolveSessionMode |
| `apps/web/src/shared/contracts/backendAdapters.js` | mapBoardViewToColumns, mergeBoardIntoPlan |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | persistGeneralPreferences, handleGeneralFieldChange |

## Entry Points

Start here when exploring this area:

- **`saveAccountStore`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:290`
- **`clearPendingLogoutRedirect`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:301`
- **`clearPendingAccountRedirect`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:305`
- **`saveAccountStoreAfterAccountRemoval`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:309`
- **`saveAuthenticatedSession`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:329`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `saveAccountStore` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 290 |
| `clearPendingLogoutRedirect` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 301 |
| `clearPendingAccountRedirect` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 305 |
| `saveAccountStoreAfterAccountRemoval` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 309 |
| `saveAuthenticatedSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 329 |
| `bootstrap` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 362 |
| `refreshSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 435 |
| `switchAccount` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 498 |
| `targetAccount` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 505 |
| `logout` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 650 |
| `savedAccounts` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 668 |
| `formatDateWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 260 |
| `formatTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 288 |
| `formatClockTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 301 |
| `formatDateTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 321 |
| `formatMonthLabelWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 329 |
| `formatCompactDayMonthWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 342 |
| `formatDate` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 643 |
| `formatTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 647 |
| `formatDateTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 655 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleAccountAvatarSelected → GetAccountId` | cross_community | 6 |
| `HandleAccountAvatarSelected → CreateEmptyAccountStore` | cross_community | 6 |
| `HandleSubmit → GetAccountId` | cross_community | 5 |
| `HandleSubmit → MapHomePageToRoute` | cross_community | 5 |
| `HandleSubmit → NormalizePathname` | cross_community | 5 |
| `HandleSubmit → BuildDemoAccountKey` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 18 calls |
| Config | 7 calls |
| Contracts | 6 calls |
| Auth | 4 calls |
| Hooks | 2 calls |
| SidebarAccountMenu | 1 calls |
| OAuthCallback | 1 calls |
| Data | 1 calls |

## How to Explore

1. `gitnexus_context({name: "saveAccountStore"})` — see callers and callees
2. `gitnexus_query({query: "context"})` — find related execution flows
3. Read key files listed above for implementation details
