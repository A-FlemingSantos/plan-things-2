---
name: providers
description: "Skill for the Providers area of plan-things-2. 85 symbols across 12 files."
---

# Providers

85 symbols | 12 files | Cohesion: 82%

## When to Use

- Working with code in `apps/`
- Understanding how useAuth, FilesProvider, request work
- Modifying providers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/providers/PlansProvider.js` | usePlans, PlansProvider, request, loadPlans, createPlan (+16) |
| `apps/mobile/src/providers/AuthProvider.js` | useAuth, withInitials, normalizeSession, saveSession, bootstrap (+15) |
| `apps/mobile/src/providers/FilesProvider.js` | FilesProvider, request, loadFiles, createFolder, uploadFile (+8) |
| `apps/mobile/src/providers/authSessionPolicy.js` | isAuthFailure, shouldClearSessionAfterRefreshFailure, normalizePathname, normalizeLogoutRedirect, resolveAuthScreenModeFromRedirect (+4) |
| `apps/mobile/src/screens/FilesScreen.js` | FilesScreen, openCreateFlow, openFileMenu, closeFileSheet, updateSelectedFile (+3) |
| `apps/mobile/src/screens/MobileKanbanBoard.js` | updateCard, toggleTaskPinned, attachCardFile, uploadCardFile, removeCardAttachment |
| `apps/mobile/src/screens/AuthScreen.js` | submit, oauthErrorMessage, AuthScreen |
| `apps/mobile/src/screens/HomeScreen.js` | HomeScreen, openPlan |
| `apps/mobile/App.js` | AppContent |
| `apps/mobile/src/theme/platformRuntime.js` | resolveInteractivePointerEventsStyle |

## Entry Points

Start here when exploring this area:

- **`useAuth`** (Function) — `apps/mobile/src/providers/AuthProvider.js:388`
- **`FilesProvider`** (Function) — `apps/mobile/src/providers/FilesProvider.js:25`
- **`request`** (Function) — `apps/mobile/src/providers/FilesProvider.js:29`
- **`loadFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:34`
- **`createFolder`** (Function) — `apps/mobile/src/providers/FilesProvider.js:53`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useAuth` | Function | `apps/mobile/src/providers/AuthProvider.js` | 388 |
| `FilesProvider` | Function | `apps/mobile/src/providers/FilesProvider.js` | 25 |
| `request` | Function | `apps/mobile/src/providers/FilesProvider.js` | 29 |
| `loadFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 34 |
| `createFolder` | Function | `apps/mobile/src/providers/FilesProvider.js` | 53 |
| `uploadFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 61 |
| `toggleFavorite` | Function | `apps/mobile/src/providers/FilesProvider.js` | 102 |
| `trashFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 107 |
| `restoreFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 112 |
| `shareToPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 117 |
| `unshareFromPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 123 |
| `usePlans` | Function | `apps/mobile/src/providers/PlansProvider.js` | 224 |
| `FilesScreen` | Function | `apps/mobile/src/screens/FilesScreen.js` | 90 |
| `openCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 193 |
| `openFileMenu` | Function | `apps/mobile/src/screens/FilesScreen.js` | 235 |
| `closeFileSheet` | Function | `apps/mobile/src/screens/FilesScreen.js` | 241 |
| `updateSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 247 |
| `deleteSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 265 |
| `submitCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 285 |
| `HomeScreen` | Function | `apps/mobile/src/screens/HomeScreen.js` | 172 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 3 calls |
| Screens | 3 calls |
| Services | 1 calls |
| Workspace | 1 calls |

## How to Explore

1. `gitnexus_context({name: "useAuth"})` — see callers and callees
2. `gitnexus_query({query: "providers"})` — find related execution flows
3. Read key files listed above for implementation details
