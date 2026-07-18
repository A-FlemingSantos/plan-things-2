---
name: gitnexus-area-settingspage
description: "Skill for the SettingsPage area of plan-things-2. 73 symbols across 27 files."
---

# SettingsPage

73 symbols | 27 files | Cohesion: 58%

## When to Use

- Working with code in `apps/`
- Understanding how cancelIntelligenceMessage, getIntelligenceConversation, listIntelligenceConversations work
- Modifying settingspage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleDisconnectGmail, handleRevokeOtherSessions, handleRevokeSession, handleSaveAccount, handleSavePassword (+31) |
| `apps/web/src/features/intelligence/api/intelligenceApi.js` | cancelIntelligenceMessage, getIntelligenceConversation, listIntelligenceConversations, updateIntelligenceConversation |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx` | renderModalSettings, renderSettings, mockSettingsSnapshot, settingsSnapshot |
| `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | acceptInvite, declineInvite |
| `apps/web/src/shared/components/icons/commonIcons.jsx` | UndefinedIcon, CloseIcon |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.mobile.test.jsx` | LocationProbe, renderSettings |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | restoreLocalDefaults, updateLocal |
| `apps/web/src/shared/components/WorkspaceIconBadge/WorkspaceIconBadge.jsx` | getWorkspaceIconOption, normalizeWorkspaceIconKey |
| `apps/web/src/features/intelligence/hooks/useAiConversation.js` | cancelActiveGeneration |
| `apps/web/src/features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx` | handleArchiveConversation |

## Entry Points

Start here when exploring this area:

- **`cancelIntelligenceMessage`** (Function) — `apps/web/src/features/intelligence/api/intelligenceApi.js:70`
- **`getIntelligenceConversation`** (Function) — `apps/web/src/features/intelligence/api/intelligenceApi.js:21`
- **`listIntelligenceConversations`** (Function) — `apps/web/src/features/intelligence/api/intelligenceApi.js:41`
- **`updateIntelligenceConversation`** (Function) — `apps/web/src/features/intelligence/api/intelligenceApi.js:62`
- **`cancelActiveGeneration`** (Function) — `apps/web/src/features/intelligence/hooks/useAiConversation.js:806`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `cancelIntelligenceMessage` | Function | `apps/web/src/features/intelligence/api/intelligenceApi.js` | 70 |
| `getIntelligenceConversation` | Function | `apps/web/src/features/intelligence/api/intelligenceApi.js` | 21 |
| `listIntelligenceConversations` | Function | `apps/web/src/features/intelligence/api/intelligenceApi.js` | 41 |
| `updateIntelligenceConversation` | Function | `apps/web/src/features/intelligence/api/intelligenceApi.js` | 62 |
| `cancelActiveGeneration` | Function | `apps/web/src/features/intelligence/hooks/useAiConversation.js` | 806 |
| `handleArchiveConversation` | Function | `apps/web/src/features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx` | 327 |
| `handleDisconnectGmail` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 913 |
| `handleRevokeOtherSessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 996 |
| `handleRevokeSession` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 973 |
| `handleSaveAccount` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 649 |
| `handleSavePassword` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 757 |
| `loadIntegrations` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 358 |
| `loadSecuritySessions` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 952 |
| `refreshPlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 374 |
| `acceptInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 84 |
| `declineInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 112 |
| `reloadFileLists` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardFiles.js` | 43 |
| `clearInboxDeliveries` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardInbox.js` | 71 |
| `apiRequest` | Function | `apps/web/src/shared/api/apiClient.js` | 6 |
| `SettingsAccountSection` | Function | `apps/web/src/features/settings/components/SettingsAccountSection/SettingsAccountSection.jsx` | 11 |

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
| `RenderWorkspace → NormalizeWorkspaceIconKey` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 15 calls |
| Hooks | 6 calls |
| Contracts | 2 calls |
| ProductSidebar | 1 calls |
| AppThemeScope | 1 calls |
| Config | 1 calls |

## How to Explore

1. `context({name: "cancelIntelligenceMessage"})` — see callers and callees
2. `query({search_query: "settingspage"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
