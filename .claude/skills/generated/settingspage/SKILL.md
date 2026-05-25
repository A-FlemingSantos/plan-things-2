---
name: settingspage
description: "Skill for the SettingsPage area of plan-things-2. 64 symbols across 17 files."
---

# SettingsPage

64 symbols | 17 files | Cohesion: 59%

## When to Use

- Working with code in `apps/`
- Understanding how loadIntegrations, handleDisconnectGmail, loadSecuritySessions work
- Modifying settingspage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | normalizeGmailIntegration, isDeletePhraseValid, DeleteAccountDialog, loadIntegrations, handleDisconnectGmail (+35) |
| `apps/web/src/shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx` | normalizeWorkspaceIconKey, getWorkspaceIconOption, WorkspaceIconGlyph |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | refreshPlanDetails, refreshPlans |
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | removeMemberFromPlan, downloadFile |
| `apps/web/src/shared/api/apiClient.js` | apiRequest, triggerBlobDownload |
| `apps/web/src/shared/config/routes.js` | buildWorkspaceBoardPath, toRouteString |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | updateLocal, restoreLocalDefaults |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx` | mockSettingsSnapshot, settingsSnapshot |
| `apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx` | acceptInvite |
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | moveCard |

## Entry Points

Start here when exploring this area:

- **`loadIntegrations`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:561`
- **`handleDisconnectGmail`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:1116`
- **`loadSecuritySessions`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:1155`
- **`handleRevokeSession`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:1176`
- **`handleRevokeOtherSessions`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:1199`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `loadIntegrations` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 561 |
| `handleDisconnectGmail` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1116 |
| `loadSecuritySessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1155 |
| `handleRevokeSession` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1176 |
| `handleRevokeOtherSessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1199 |
| `handleExportData` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1223 |
| `handleDeleteAccount` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1325 |
| `renderSecurity` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 2078 |
| `acceptInvite` | Function | `apps/web/src/features/workspace/components/InviteNotifications/InviteNotifications.jsx` | 89 |
| `refreshPlanDetails` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 335 |
| `refreshPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 360 |
| `moveCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 915 |
| `acceptInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 84 |
| `removeMemberFromPlan` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1132 |
| `downloadFile` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1258 |
| `apiRequest` | Function | `apps/web/src/shared/api/apiClient.js` | 6 |
| `triggerBlobDownload` | Function | `apps/web/src/shared/api/apiClient.js` | 14 |
| `buildWorkspaceBoardPath` | Function | `apps/web/src/shared/config/routes.js` | 132 |
| `patchSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 479 |
| `loadWorkspaceDashboard` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 614 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleAccountAvatarSelected → GetAccountId` | cross_community | 6 |
| `HandleAccountAvatarSelected → CreateEmptyAccountStore` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 13 calls |
| Auth | 7 calls |
| Workspace | 3 calls |
| KanbanBoard | 2 calls |
| OAuthCallback | 1 calls |
| AppThemeScope | 1 calls |
| Data | 1 calls |
| InviteNotifications | 1 calls |

## How to Explore

1. `gitnexus_context({name: "loadIntegrations"})` — see callers and callees
2. `gitnexus_query({query: "settingspage"})` — find related execution flows
3. Read key files listed above for implementation details
