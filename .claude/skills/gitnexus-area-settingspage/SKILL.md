---
name: gitnexus-area-settingspage
description: "Skill for the SettingsPage area of plan-things-2. 79 symbols across 31 files."
---

# SettingsPage

79 symbols | 31 files | Cohesion: 66%

## When to Use

- Working with code in `apps/`
- Understanding how handleConnectGitHub, handleConnectGmail, handleDisconnectGitHub work
- Modifying settingspage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleConnectGitHub, handleConnectGmail, handleDisconnectGitHub, handleDisconnectGmail, handleExportData (+33) |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx` | renderModalSettings, renderSettings, mockSettingsSnapshot, settingsSnapshot |
| `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | acceptInvite, declineInvite, loadInvite |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFiles.js` | downloadFile, reloadFileLists |
| `apps/web/src/shared/api/apiClient.js` | apiRequest, triggerBlobDownload |
| `apps/web/src/shared/config/routes.js` | buildWorkspaceBoardPath, toRouteString |
| `apps/web/src/shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx` | getWorkspaceIconOption, normalizeWorkspaceIconKey |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.mobile.test.jsx` | LocationProbe, renderSettings |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | restoreLocalDefaults, updateLocal |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | refreshPlans |

## Entry Points

Start here when exploring this area:

- **`handleConnectGitHub`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:973`
- **`handleConnectGmail`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:917`
- **`handleDisconnectGitHub`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:999`
- **`handleDisconnectGmail`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:947`
- **`handleExportData`** (Function) — `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:1102`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleConnectGitHub` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 973 |
| `handleConnectGmail` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 917 |
| `handleDisconnectGitHub` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 999 |
| `handleDisconnectGmail` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 947 |
| `handleExportData` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1102 |
| `handleRevokeOtherSessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1078 |
| `handleRevokeSession` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1055 |
| `handleSaveAccount` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 683 |
| `handleSavePassword` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 791 |
| `loadIntegrations` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 391 |
| `loadSecuritySessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1034 |
| `loadSessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 492 |
| `refreshPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 371 |
| `acceptInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 86 |
| `declineInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 114 |
| `loadInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 53 |
| `request` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx` | 379 |
| `downloadFile` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFiles.js` | 143 |
| `reloadFileLists` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFiles.js` | 43 |
| `clearInboxDeliveries` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardInbox.js` | 71 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleSubmit → FetchImpl` | cross_community | 5 |
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `HandleSubmit → ApiClientError` | cross_community | 5 |
| `UploadLocalFileToCard → FetchImpl` | cross_community | 4 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |
| `UploadLocalFileToCard → ApiClientError` | cross_community | 4 |
| `AttachFileToCard → FetchImpl` | cross_community | 4 |
| `AttachFileToCard → BuildApiUrl` | cross_community | 4 |
| `AttachFileToCard → ApiClientError` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 9 calls |
| Hooks | 8 calls |
| Contracts | 2 calls |
| Icons | 1 calls |
| Components | 1 calls |
| SidebarAccountMenu | 1 calls |
| Config | 1 calls |

## How to Explore

1. `context({name: "handleConnectGitHub"})` — see callers and callees
2. `query({search_query: "settingspage"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
