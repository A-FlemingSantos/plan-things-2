---
name: gitnexus-area-screens
description: "Skill for the Screens area of plan-things-2. 95 symbols across 17 files."
---

# Screens

95 symbols | 17 files | Cohesion: 77%

## When to Use

- Working with code in `apps/`
- Understanding how closeAddCardSheet, submitNewCard, loadPlanFiles work
- Modifying screens-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/screens/MobileKanbanBoard.js` | buildCalendarDays, calendarDays, closeAddCardSheet, commitSchedule, createLocalCard (+43) |
| `apps/mobile/src/screens/SettingsScreen.js` | connectGmail, disconnectGmail, loadActiveSessions, request, revokeOtherSessions (+11) |
| `apps/mobile/src/screens/AuthScreen.js` | createStyles, handleGoogle, notify, soon, submit |
| `apps/mobile/src/screens/FilesScreen.js` | createStyles, filteredFiles, closeNewItemSheet, onPanResponderRelease |
| `apps/mobile/src/screens/settingsPasswordFlow.js` | getPasswordFlowCopy, resolvePasswordFlow, buildPasswordRequest |
| `apps/mobile/src/screens/HomeScreen.js` | createStyles, closeNewPlanSheet, createPlan |
| `apps/mobile/src/screens/mobileTaskCompletion.js` | buildTaskCompletionPatch, isLegacyDoneColumn, isTaskDone |
| `apps/mobile/src/providers/FilesProvider.js` | loadPlanFiles, useFiles |
| `apps/mobile/src/theme/platformRuntime.js` | resolveWebPointerEvents, withPlatformPointerEvents |
| `packages/shared-client/src/files.js` | getFileSizeBytes, getFileTimestamp |

## Entry Points

Start here when exploring this area:

- **`closeAddCardSheet`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1724`
- **`submitNewCard`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1728`
- **`loadPlanFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:43`
- **`useFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:146`
- **`MobileKanbanBoard`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1239`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `closeAddCardSheet` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1724 |
| `submitNewCard` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1728 |
| `loadPlanFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 43 |
| `useFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 146 |
| `MobileKanbanBoard` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1239 |
| `handleColumnLayout` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1416 |
| `openAddCardSheet` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1718 |
| `withPlatformPointerEvents` | Function | `apps/mobile/src/theme/platformRuntime.js` | 19 |
| `startOAuthLogin` | Function | `apps/mobile/src/providers/AuthProvider.js` | 311 |
| `connectGmail` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 249 |
| `disconnectGmail` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 259 |
| `loadActiveSessions` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 354 |
| `request` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 180 |
| `revokeOtherSessions` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 391 |
| `revokeSession` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 374 |
| `resolveMobileCallbackClient` | Function | `apps/mobile/src/services/mobileClient.js` | 3 |
| `SettingsScreen` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 149 |
| `loadSettings` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 185 |
| `persistNotifications` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 217 |
| `savePreferences` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 274 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Providers | 8 calls |
| Components | 2 calls |
| Theme | 2 calls |
| NewPlanPopover | 2 calls |

## How to Explore

1. `context({name: "closeAddCardSheet"})` — see callers and callees
2. `query({search_query: "screens"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
