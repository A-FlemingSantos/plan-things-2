---
name: gitnexus-area-context
description: "Skill for the Context area of plan-things-2. 129 symbols across 27 files."
---

# Context

129 symbols | 27 files | Cohesion: 67%

## When to Use

- Working with code in `apps/`
- Understanding how formatClockTime, formatClockTimeWithPreferences, formatCompactDayMonth work
- Modifying context-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | capitalizeFirst, formatClockTime, formatClockTimeWithPreferences, formatCompactDayMonth, formatCompactDayMonthWithPreferences (+38) |
| `apps/web/src/features/auth/context/AuthContext.jsx` | activateStoredAccount, clearPendingAccountRedirect, createEmptyAccountStore, getAccountId, normalizeAccountStore (+33) |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | createPlan, ensureInteractiveSession, renamePlan, setPlanById, updatePlan (+6) |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleNotificationToggle, persistNotifications, handleGeneralFieldChange, persistGeneralPreferences |
| `apps/web/src/features/auth/context/AuthContext.test.jsx` | createAccessToken, toBase64Url, readActiveStoredSession, readStoredValue |
| `apps/web/src/shared/context/AppChromeContext.jsx` | registerLoadingScreen, useAppChrome |
| `apps/web/src/features/auth/utils/authRedirect.js` | resolveAccountHomeRoute, resolvePostAuthRoute |
| `apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx` | handleSwitchAccount, renderAccountsSubmenu |
| `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx` | completeLogin, finishPopupOAuth |
| `apps/web/src/features/auth/utils/oauthPopup.js` | isOAuthPopupContext, postOAuthPopupResult |

## Entry Points

Start here when exploring this area:

- **`formatClockTime`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:651`
- **`formatClockTimeWithPreferences`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:301`
- **`formatCompactDayMonth`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:663`
- **`formatCompactDayMonthWithPreferences`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:342`
- **`formatDate`** (Function) — `apps/web/src/features/preferences/context/PreferencesContext.jsx:643`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatClockTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 651 |
| `formatClockTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 301 |
| `formatCompactDayMonth` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 663 |
| `formatCompactDayMonthWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 342 |
| `formatDate` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 643 |
| `formatDateTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 655 |
| `formatDateTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 321 |
| `formatDateWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 260 |
| `formatIntl` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 634 |
| `formatMonthLabel` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 659 |
| `formatMonthLabelWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 329 |
| `formatTime` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 647 |
| `formatTimeWithPreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 288 |
| `clearPendingAccountRedirect` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 305 |
| `patchSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 485 |
| `saveAuthenticatedSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 335 |
| `savedAccounts` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 674 |
| `switchAccount` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 504 |
| `bootstrap` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 368 |
| `refreshSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 441 |

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
| SettingsPage | 19 calls |
| Contracts | 7 calls |
| Config | 5 calls |
| Data | 3 calls |
| AppThemeScope | 2 calls |
| KanbanBoard | 1 calls |
| KanbanColumnStatusPicker | 1 calls |

## How to Explore

1. `context({name: "formatClockTime"})` — see callers and callees
2. `query({search_query: "context"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
