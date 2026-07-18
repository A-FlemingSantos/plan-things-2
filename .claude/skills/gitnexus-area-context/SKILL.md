---
name: gitnexus-area-context
description: "Skill for the Context area of plan-things-2. 154 symbols across 31 files."
---

# Context

154 symbols | 31 files | Cohesion: 65%

## When to Use

- Working with code in `apps/`
- Understanding how useAuth, OAuthCallback, readAuthIntent work
- Modifying context-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | usePreferences, capitalizeFirst, formatClockTime, formatClockTimeWithPreferences, formatCompactDayMonth (+40) |
| `apps/web/src/features/auth/context/AuthContext.jsx` | useAuth, activateStoredAccount, createEmptyAccountStore, getAccountId, normalizeAccountStore (+36) |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | PlansProvider, hydrateBackendPlans, createPlan, ensureInteractiveSession, renamePlan (+8) |
| `apps/web/src/features/auth/utils/authRedirect.js` | buildAuthRedirectState, resolveAuthRedirectTarget, sanitizeAuthRedirectTarget, resolveAccountHomeRoute, resolvePostAuthRoute |
| `apps/web/src/features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx` | IntelligenceChat, SparkleIcon, buildInitialHandoff, normalizeOptionalId |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleNotificationToggle, persistNotifications, handleGeneralFieldChange, persistGeneralPreferences |
| `apps/web/src/features/auth/context/AuthContext.test.jsx` | createAccessToken, toBase64Url, readActiveStoredSession, readStoredValue |
| `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx` | OAuthCallback, completeLogin, finishPopupOAuth |
| `apps/web/src/features/workspace/data/kanbanColorPalette.js` | resolveKanbanAccentColor, resolveKanbanAccentForeground, isKanbanAccentBaseColor |
| `apps/web/src/shared/components/icons/workspaceHeaderIcons.jsx` | SparkIcon, WorkspaceChevronDownIcon, WorkspaceTitleIcon |

## Entry Points

Start here when exploring this area:

- **`useAuth`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:730`
- **`OAuthCallback`** (Function) — `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx:9`
- **`readAuthIntent`** (Function) — `apps/web/src/features/auth/utils/authIntent.js:11`
- **`buildAuthRedirectState`** (Function) — `apps/web/src/features/auth/utils/authRedirect.js:42`
- **`resolveAuthRedirectTarget`** (Function) — `apps/web/src/features/auth/utils/authRedirect.js:22`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useAuth` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 730 |
| `OAuthCallback` | Function | `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx` | 9 |
| `readAuthIntent` | Function | `apps/web/src/features/auth/utils/authIntent.js` | 11 |
| `buildAuthRedirectState` | Function | `apps/web/src/features/auth/utils/authRedirect.js` | 42 |
| `resolveAuthRedirectTarget` | Function | `apps/web/src/features/auth/utils/authRedirect.js` | 22 |
| `sanitizeAuthRedirectTarget` | Function | `apps/web/src/features/auth/utils/authRedirect.js` | 18 |
| `readSessionModeFromAuthState` | Function | `apps/web/src/features/auth/utils/sessionMode.js` | 12 |
| `useCalendarEvents` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 81 |
| `IntelligenceChat` | Function | `apps/web/src/features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx` | 115 |
| `usePreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 710 |
| `PlansProvider` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 31 |
| `hydrateBackendPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 105 |
| `resolveKanbanAccentColor` | Function | `apps/web/src/features/workspace/data/kanbanColorPalette.js` | 49 |
| `resolveKanbanAccentForeground` | Function | `apps/web/src/features/workspace/data/kanbanColorPalette.js` | 59 |
| `ProductAppShell` | Function | `apps/web/src/shared/components/ProductAppShell/ProductAppShell.jsx` | 22 |
| `handleOpenAddAccount` | Function | `apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx` | 310 |
| `WorkspaceHeader` | Function | `apps/web/src/shared/components/WorkspaceHeader/WorkspaceHeader.jsx` | 27 |
| `openSettingsSection` | Function | `apps/web/src/shared/components/WorkspaceHeader/WorkspaceHeader.jsx` | 45 |
| `SparkIcon` | Function | `apps/web/src/shared/components/icons/workspaceHeaderIcons.jsx` | 87 |
| `WorkspaceChevronDownIcon` | Function | `apps/web/src/shared/components/icons/workspaceHeaderIcons.jsx` | 25 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleOAuth → NormalizePathname` | cross_community | 7 |
| `HandleSubmit → GetAccountId` | cross_community | 5 |
| `HandleSubmit → FetchImpl` | cross_community | 5 |
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `HandleSubmit → ApiClientError` | cross_community | 5 |
| `HandleSubmit → BuildDemoAccountKey` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 23 calls |
| Config | 9 calls |
| Contracts | 9 calls |
| Data | 3 calls |
| Hooks | 3 calls |
| Workspace | 2 calls |
| AppThemeScope | 1 calls |
| ConversationToolbar | 1 calls |

## How to Explore

1. `context({name: "useAuth"})` — see callers and callees
2. `query({search_query: "context"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
