---
name: screens
description: "Skill for the Screens area of plan-things-2. 103 symbols across 21 files."
---

# Screens

103 symbols | 21 files | Cohesion: 84%

## When to Use

- Working with code in `apps/`
- Understanding how patchSession, SettingsScreen, request work
- Modifying screens-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/screens/MobileKanbanBoard.js` | createLocalCard, padDatePart, dateValueFromDate, parseDateValue, formatShortDateLabel (+44) |
| `apps/mobile/src/screens/SettingsScreen.js` | sanitizeFilename, triggerWebDownload, SettingsScreen, request, loadSettings (+14) |
| `apps/mobile/src/screens/AuthScreen.js` | createStyles, notify, handleGoogle, soon |
| `apps/mobile/src/screens/FilesScreen.js` | createStyles, sorted, closeNewItemSheet, onPanResponderRelease |
| `apps/mobile/src/screens/settingsPasswordFlow.js` | resolvePasswordFlow, getPasswordFlowCopy, buildPasswordRequest |
| `apps/mobile/src/screens/HomeScreen.js` | createStyles, closeNewPlanSheet, createPlan |
| `apps/mobile/src/screens/mobileTaskCompletion.js` | isLegacyDoneColumn, isTaskDone, buildTaskCompletionPatch |
| `apps/mobile/src/providers/AuthProvider.js` | patchSession, startOAuthLogin |
| `apps/mobile/src/providers/FilesProvider.js` | loadPlanFiles, useFiles |
| `apps/mobile/src/theme/platformRuntime.js` | resolveWebPointerEvents, withPlatformPointerEvents |

## Entry Points

Start here when exploring this area:

- **`patchSession`** (Function) — `apps/mobile/src/providers/AuthProvider.js:332`
- **`SettingsScreen`** (Function) — `apps/mobile/src/screens/SettingsScreen.js:149`
- **`request`** (Function) — `apps/mobile/src/screens/SettingsScreen.js:180`
- **`loadSettings`** (Function) — `apps/mobile/src/screens/SettingsScreen.js:185`
- **`persistNotifications`** (Function) — `apps/mobile/src/screens/SettingsScreen.js:217`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `patchSession` | Function | `apps/mobile/src/providers/AuthProvider.js` | 332 |
| `SettingsScreen` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 149 |
| `request` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 180 |
| `loadSettings` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 185 |
| `persistNotifications` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 217 |
| `updateNotification` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 240 |
| `disconnectGmail` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 259 |
| `saveAccount` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 264 |
| `savePreferences` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 274 |
| `saveWorkspace` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 305 |
| `savePassword` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 315 |
| `loadActiveSessions` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 354 |
| `revokeSession` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 374 |
| `revokeOtherSessions` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 391 |
| `exportData` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 408 |
| `deleteAccount` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 450 |
| `closeSheet` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 491 |
| `resolvePasswordFlow` | Function | `apps/mobile/src/screens/settingsPasswordFlow.js` | 0 |
| `getPasswordFlowCopy` | Function | `apps/mobile/src/screens/settingsPasswordFlow.js` | 12 |
| `buildPasswordRequest` | Function | `apps/mobile/src/screens/settingsPasswordFlow.js` | 32 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Providers | 12 calls |
| Components | 2 calls |
| Theme | 2 calls |
| Workspace | 1 calls |
| CardModal | 1 calls |

## How to Explore

1. `gitnexus_context({name: "patchSession"})` — see callers and callees
2. `gitnexus_query({query: "screens"})` — find related execution flows
3. Read key files listed above for implementation details
