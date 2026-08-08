---
name: gitnexus-area-providers
description: "Skill for the Providers area of plan-things-2. 88 symbols across 14 files."
---

# Providers

88 symbols | 14 files | Cohesion: 76%

## When to Use

- Working with code in `apps/`
- Understanding how createFolder, loadFiles, request work
- Modifying providers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/providers/PlansProvider.js` | addComment, attachFileToCard, createChecklist, createChecklistItem, deleteCard (+15) |
| `apps/mobile/src/providers/AuthProvider.js` | bootstrap, completeOAuthLogin, getSessionAccountId, login, normalizeSession (+15) |
| `apps/mobile/src/providers/FilesProvider.js` | createFolder, loadFiles, request, restoreFile, shareToPlan (+8) |
| `apps/mobile/src/screens/FilesScreen.js` | FilesScreen, closeFileSheet, deleteSelectedFile, downloadSelectedFile, openCreateFlow (+3) |
| `apps/mobile/src/providers/authSessionPolicy.js` | isAuthFailure, shouldClearSessionAfterRefreshFailure, decodeBase64, decodeBase64Url, readAccessTokenExpiresAt (+3) |
| `apps/mobile/src/screens/MobileKanbanBoard.js` | attachCardFile, removeCardAttachment, toggleTaskPinned, updateCard, uploadCardFile |
| `apps/mobile/src/screens/SettingsScreen.js` | exportData, sanitizeFilename, triggerWebDownload |
| `packages/shared-client/src/plans.js` | buildInitials, buildPlanCreatePayload, mergePlanDetails |
| `apps/mobile/src/services/api.js` | mobileApiRequest, mobileApiUrl |
| `packages/shared-client/src/board.js` | mapBoardViewToColumns, mergeBoardIntoPlan |

## Entry Points

Start here when exploring this area:

- **`createFolder`** (Function) — `apps/mobile/src/providers/FilesProvider.js:53`
- **`loadFiles`** (Function) — `apps/mobile/src/providers/FilesProvider.js:34`
- **`request`** (Function) — `apps/mobile/src/providers/FilesProvider.js:29`
- **`restoreFile`** (Function) — `apps/mobile/src/providers/FilesProvider.js:112`
- **`shareToPlan`** (Function) — `apps/mobile/src/providers/FilesProvider.js:117`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createFolder` | Function | `apps/mobile/src/providers/FilesProvider.js` | 53 |
| `loadFiles` | Function | `apps/mobile/src/providers/FilesProvider.js` | 34 |
| `request` | Function | `apps/mobile/src/providers/FilesProvider.js` | 29 |
| `restoreFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 112 |
| `shareToPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 117 |
| `toggleFavorite` | Function | `apps/mobile/src/providers/FilesProvider.js` | 102 |
| `trashFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 107 |
| `unshareFromPlan` | Function | `apps/mobile/src/providers/FilesProvider.js` | 123 |
| `uploadFile` | Function | `apps/mobile/src/providers/FilesProvider.js` | 61 |
| `FilesScreen` | Function | `apps/mobile/src/screens/FilesScreen.js` | 87 |
| `closeFileSheet` | Function | `apps/mobile/src/screens/FilesScreen.js` | 237 |
| `deleteSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 261 |
| `downloadSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 270 |
| `openCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 189 |
| `openFileMenu` | Function | `apps/mobile/src/screens/FilesScreen.js` | 231 |
| `submitCreateFlow` | Function | `apps/mobile/src/screens/FilesScreen.js` | 281 |
| `updateSelectedFile` | Function | `apps/mobile/src/screens/FilesScreen.js` | 243 |
| `resolveInteractivePointerEventsStyle` | Function | `apps/mobile/src/theme/platformRuntime.js` | 7 |
| `addComment` | Function | `apps/mobile/src/providers/PlansProvider.js` | 135 |
| `attachFileToCard` | Function | `apps/mobile/src/providers/PlansProvider.js` | 175 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleSubmit → BuildApiUrl` | cross_community | 5 |
| `UploadLocalFileToCard → BuildApiUrl` | cross_community | 4 |
| `AttachFileToCard → BuildApiUrl` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Screens | 5 calls |
| Cluster_313 | 3 calls |
| Components | 2 calls |
| Services | 1 calls |
| Contracts | 1 calls |
| Cluster_311 | 1 calls |

## How to Explore

1. `context({name: "createFolder"})` — see callers and callees
2. `query({search_query: "providers"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
