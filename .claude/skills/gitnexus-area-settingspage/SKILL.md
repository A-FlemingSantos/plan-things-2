---
name: gitnexus-area-settingspage
description: "Skill for the SettingsPage area of plan-things-2. 73 symbols across 29 files."
---

# SettingsPage

73 symbols | 29 files | Cohesion: 59%

## When to Use

- Working with code in `apps/`
- Understanding how SettingsAccountSection, SettingsAutoSaveStatus, SettingsField work
- Modifying settingspage-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | handleRevokeSession, renderAccount, renderContent, renderGeneral, renderIntegrations (+30) |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.gmail.test.jsx` | renderModalSettings, renderSettings, mockSettingsSnapshot, settingsSnapshot |
| `apps/web/src/features/auth/utils/authRedirect.js` | buildAuthRedirectState, resolveAuthRedirectTarget, sanitizeAuthRedirectTarget |
| `apps/web/src/shared/components/icons/commonIcons.jsx` | UndefinedIcon, CloseIcon |
| `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | enrichGeneratedCardKinds, loadEvents |
| `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | acceptInvite, declineInvite |
| `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.mobile.test.jsx` | LocationProbe, renderSettings |
| `apps/web/src/features/preferences/context/PreferencesContext.jsx` | restoreLocalDefaults, updateLocal |
| `apps/web/src/features/settings/components/SettingsAccountSection/SettingsAccountSection.jsx` | SettingsAccountSection |
| `apps/web/src/features/settings/components/settingsForm/SettingsAutoSaveStatus.jsx` | SettingsAutoSaveStatus |

## Entry Points

Start here when exploring this area:

- **`SettingsAccountSection`** (Function) — `apps/web/src/features/settings/components/SettingsAccountSection/SettingsAccountSection.jsx:11`
- **`SettingsAutoSaveStatus`** (Function) — `apps/web/src/features/settings/components/settingsForm/SettingsAutoSaveStatus.jsx:2`
- **`SettingsField`** (Function) — `apps/web/src/features/settings/components/settingsForm/SettingsField.jsx:2`
- **`SettingsSaveButton`** (Function) — `apps/web/src/features/settings/components/settingsForm/SettingsSaveButton.jsx:3`
- **`SettingsSectionGroup`** (Function) — `apps/web/src/features/settings/components/settingsForm/SettingsSectionGroup.jsx:2`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SettingsAccountSection` | Function | `apps/web/src/features/settings/components/SettingsAccountSection/SettingsAccountSection.jsx` | 11 |
| `SettingsAutoSaveStatus` | Function | `apps/web/src/features/settings/components/settingsForm/SettingsAutoSaveStatus.jsx` | 2 |
| `SettingsField` | Function | `apps/web/src/features/settings/components/settingsForm/SettingsField.jsx` | 2 |
| `SettingsSaveButton` | Function | `apps/web/src/features/settings/components/settingsForm/SettingsSaveButton.jsx` | 3 |
| `SettingsSectionGroup` | Function | `apps/web/src/features/settings/components/settingsForm/SettingsSectionGroup.jsx` | 2 |
| `handleRevokeSession` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 973 |
| `renderAccount` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1187 |
| `renderContent` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1900 |
| `renderGeneral` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1244 |
| `renderIntegrations` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1636 |
| `renderNotifications` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1704 |
| `renderSecurity` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1767 |
| `renderWorkspace` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 1443 |
| `Toggle` | Function | `apps/web/src/shared/components/Toggle/Toggle.jsx` | 2 |
| `UndefinedIcon` | Function | `apps/web/src/shared/components/icons/commonIcons.jsx` | 120 |
| `GmailIcon` | Function | `apps/web/src/shared/components/icons/integrationIcons.jsx` | 26 |
| `formatBytes` | Function | `apps/web/src/shared/utils/formatBytes.js` | 2 |
| `loadEvents` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 105 |
| `updateIntelligenceConversation` | Function | `apps/web/src/features/intelligence/api/intelligenceApi.js` | 62 |
| `handleArchiveConversation` | Function | `apps/web/src/features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx` | 318 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleOAuth → NormalizePathname` | cross_community | 7 |
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
| WorkspaceIconBadge | 7 calls |
| AppThemeScope | 4 calls |
| Config | 3 calls |
| Data | 3 calls |
| Contracts | 3 calls |
| KanbanBoard | 3 calls |
| Hooks | 2 calls |

## How to Explore

1. `context({name: "SettingsAccountSection"})` — see callers and callees
2. `query({search_query: "settingspage"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
