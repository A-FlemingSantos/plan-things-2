---
name: gitnexus-area-providers
description: "Skill for the Providers area of plan-things-2. 99 symbols across 16 files."
---

# Providers

99 symbols | 16 files | Cohesion: 79%

## When to Use

- Working with code in `apps/`
- Understanding how useAuth, FilesProvider, createFolder work
- Modifying providers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/providers/AuthProvider.js` | useAuth, bootstrap, completeOAuthLogin, getSessionAccountId, login (+18) |
| `apps/mobile/src/providers/PlansProvider.js` | usePlans, PlansProvider, addComment, attachFileToCard, createCard (+17) |
| `apps/mobile/src/providers/FilesProvider.js` | FilesProvider, createFolder, loadFiles, request, restoreFile (+8) |
| `apps/mobile/src/providers/authSessionPolicy.js` | isAuthFailure, shouldClearSessionAfterRefreshFailure, decodeBase64, decodeBase64Url, readAccessTokenExpiresAt (+4) |
| `apps/mobile/src/screens/FilesScreen.js` | FilesScreen, closeFileSheet, deleteSelectedFile, downloadSelectedFile, openCreateFlow (+3) |
| `apps/mobile/src/screens/MobileKanbanBoard.js` | attachCardFile, removeCardAttachment, toggleTaskPinned, updateCard, uploadCardFile |
| `packages/shared-client/src/board.js` | buildBoardCardPayload, mapBoardViewToColumns, mergeBoardIntoPlan |
| `apps/mobile/src/screens/SettingsScreen.js` | exportData, sanitizeFilename, triggerWebDownload |
| `packages/shared-client/src/plans.js` | buildInitials, buildPlanCreatePayload, mergePlanDetails |
| `apps/mobile/src/screens/HomeScreen.js` | HomeScreen, openPlan |

## Entry Points

Start here when exploring this area:

- **`useAuth`** (Function) — `apps/mobile/src/providers/AuthProvider.js:388`
- **`FilesProvider`** (Function) — `apps/mobile/src/providers/FilesProvider.js:25`
- **`createFolder`** (Function) — `apps/mobile/src/providers/FilesProvider.js:53`
- **`loadFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:34`
- **`request`** (Function) — `apps/mobile/src/providers/FilesProvider.js:29`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useAuth` | Function | `apps/mobile/src/providers/AuthProvider.js` | 388 |
| `FilesProvider` | Function | `apps/mobile/src/providers/FilesProvider.js` | 25 |
| `createFolder` | Function | `apps/mobile/src/providers/FilesProvider.js` | 53 |
| `loadFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 34 |
| `request` | Function | `apps/mobile/src/providers/FilesProvider.js` | 29 |
| `restoreFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 112 |
| `shareToPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 117 |
| `toggleFavorite` | Function | `apps/mobile/src/providers/FilesProvider.js` | 102 |
| `trashFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 107 |
| `unshareFromPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 123 |
| `uploadFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 61 |
| `usePlans` | Function | `apps/mobile/src/providers/PlansProvider.js` | 224 |
| `FilesScreen` | Function | `apps/mobile/src/screens/FilesScreen.js` | 90 |
| `closeFileSheet` | Function | `apps/mobile/src/screens/FilesScreen.js` | 241 |
| `deleteSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 265 |
| `downloadSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 274 |
| `openCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 193 |
| `openFileMenu` | Function | `apps/mobile/src/screens/FilesScreen.js` | 235 |
| `submitCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 285 |
| `updateSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 247 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |
| `AttachFileToCard → BuildApiUrl` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_302 | 3 calls |
| Components | 3 calls |
| Screens | 3 calls |
| Cluster_300 | 2 calls |
| Contracts | 1 calls |
| Services | 1 calls |
| Cluster_301 | 1 calls |

## How to Explore

1. `context({name: "useAuth"})` — see callers and callees
2. `query({search_query: "providers"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
