---
name: settingspage
description: "Skill for the SettingsPage area of plan-things-2. 64 symbols across 15 files."
---

# SettingsPage

64 symbols | 15 files | Cohesion: 59%

## When to Use

- Working with code in `apps/`
- Understanding how loadIntegrations, handleDisconnectGmail, loadSecuritySessions work
- Modifying settingspage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | normalizeGmailIntegration, isDeletePhraseValid, DeleteAccountDialog, loadIntegrations, handleDisconnectGmail (+35) |
| `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | describeInviteError, loadPlanInvites, submitInvite, revokePlanInvite, removeMemberFromPlan (+1) |
| `apps/web/src/shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx` | normalizeWorkspaceIconKey, getWorkspaceIconOption, WorkspaceIconGlyph |
| `apps/web/src/shared/api/apiClient.js` | apiRequest, triggerBlobDownload |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | updateLocal, restoreLocalDefaults |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx` | mockSettingsSnapshot, settingsSnapshot |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | refreshPlanDetails |
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | moveCard |
| `apps/web/src/features/auth/context/AuthContext.jsx` | patchSession |
| `apps/web/src/shared/utils/formatBytes.js` | formatBytes |

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
| `refreshPlanDetails` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 335 |
| `moveCard` | Function | `apps/web/src/features/workspace/hooks/useBoardColumns.js` | 915 |
| `loadPlanInvites` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 831 |
| `submitInvite` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1085 |
| `revokePlanInvite` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1113 |
| `removeMemberFromPlan` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1132 |
| `downloadFile` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 1258 |
| `apiRequest` | Function | `apps/web/src/shared/api/apiClient.js` | 6 |
| `triggerBlobDownload` | Function | `apps/web/src/shared/api/apiClient.js` | 14 |
| `patchSession` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 479 |
| `loadWorkspaceDashboard` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 614 |
| `persistWorkspaceName` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 697 |

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
| KanbanBoard | 3 calls |
| OAuthCallback | 1 calls |
| AppThemeScope | 1 calls |
| Data | 1 calls |
| Contracts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "loadIntegrations"})` — see callers and callees
2. `gitnexus_query({query: "settingspage"})` — find related execution flows
3. Read key files listed above for implementation details
