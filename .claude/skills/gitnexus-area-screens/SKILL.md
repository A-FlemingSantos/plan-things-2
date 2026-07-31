---
name: gitnexus-area-screens
description: "Skill for the Screens area of plan-things-2. 120 symbols across 23 files."
---

# Screens

120 symbols | 23 files | Cohesion: 74%

## When to Use

- Working with code in `apps/`
- Understanding how loadPlanFiles, useFiles, MobileKanbanBoard work
- Modifying screens-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/screens/MobileKanbanBoard.js` | MobileKanbanBoard, cloneBoardColumns, findCardEntry, handleColumnLayout, moveCard (+48) |
| `apps/mobile/src/screens/SettingsScreen.js` | SettingsScreen, loadSettings, persistNotifications, savePreferences, updateNotification (+11) |
| `apps/mobile/src/screens/AuthScreen.js` | AuthScreen, oauthErrorMessage, handleGooglePicker, handlePrimary, notify (+2) |
| `apps/mobile/src/screens/HomeScreen.js` | HomeScreen, openNewPlanSheet, openPlan, CoverSurface, resolveCoverImageUrl (+2) |
| `apps/mobile/src/utils/cardModalDateUtils.js` | buildInitialCardSchedule, extractDayFromDisplayLabel, buildCardSchedulePatch, formatDueDateLabelFromValue |
| `apps/mobile/src/utils/calendarDateUtils.js` | formatCalendarDateToBrazil, resolveCardScheduleFromRange, buildBrazilDateRange, parseBrazilDateToCalendarDate |
| `apps/mobile/src/screens/settingsPasswordFlow.js` | getPasswordFlowCopy, resolvePasswordFlow, buildPasswordRequest |
| `apps/mobile/src/screens/mobileTaskCompletion.js` | buildTaskCompletionPatch, isLegacyDoneColumn, isTaskDone |
| `apps/mobile/src/screens/FilesScreen.js` | filteredFiles, closeNewItemSheet, onPanResponderRelease |
| `apps/mobile/src/providers/FilesProvider.js` | loadPlanFiles, useFiles |

## Entry Points

Start here when exploring this area:

- **`loadPlanFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:43`
- **`useFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:146`
- **`MobileKanbanBoard`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1532`
- **`handleColumnLayout`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1709`
- **`moveCard`** (Function) — `apps/mobile/src/screens/MobileKanbanBoard.js:1951`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `loadPlanFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 43 |
| `useFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 146 |
| `MobileKanbanBoard` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1532 |
| `handleColumnLayout` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1709 |
| `moveCard` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 1951 |
| `openAddCardSheet` | Function | `apps/mobile/src/screens/MobileKanbanBoard.js` | 2016 |
| `withPlatformPointerEvents` | Function | `apps/mobile/src/theme/platformRuntime.js` | 19 |
| `buildInitialCardSchedule` | Function | `apps/mobile/src/utils/cardModalDateUtils.js` | 33 |
| `extractDayFromDisplayLabel` | Function | `apps/mobile/src/utils/cardModalDateUtils.js` | 13 |
| `SettingsScreen` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 148 |
| `loadSettings` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 184 |
| `persistNotifications` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 216 |
| `savePreferences` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 273 |
| `updateNotification` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 239 |
| `getPasswordFlowCopy` | Function | `apps/mobile/src/screens/settingsPasswordFlow.js` | 12 |
| `resolvePasswordFlow` | Function | `apps/mobile/src/screens/settingsPasswordFlow.js` | 0 |
| `setThemePreference` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 70 |
| `connectGmail` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 248 |
| `disconnectGmail` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 258 |
| `loadActiveSessions` | Function | `apps/mobile/src/screens/SettingsScreen.js` | 353 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MobileKanbanBoard → UseMobileTheme` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Providers | 10 calls |
| Components | 8 calls |
| Services | 2 calls |
| NewPlanPopover | 1 calls |
| Theme | 1 calls |
| Cluster_329 | 1 calls |
| Cluster_330 | 1 calls |

## How to Explore

1. `context({name: "loadPlanFiles"})` — see callers and callees
2. `query({search_query: "screens"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
