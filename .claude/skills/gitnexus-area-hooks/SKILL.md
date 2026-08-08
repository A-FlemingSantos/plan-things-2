---
name: gitnexus-area-hooks
description: "Skill for the Hooks area of plan-things-2. 344 symbols across 82 files."
---

# Hooks

344 symbols | 82 files | Cohesion: 80%

## When to Use

- Working with code in `apps/`
- Understanding how App, useAuth, OAuthCallback work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/hooks/useBoardColumns.js` | useBoardColumns, addCardComment, appendCommentToCard, deleteCard, deleteChecklist (+37) |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanGitHubIntegration.js` | connectRepo, errorMessage, linkByUrl, linkItem, loadCardLinks (+15) |
| `apps/web/src/features/workspace/hooks/useKanbanBoardDnd.js` | useKanbanBoardDnd, getDragType, handleCardDragEnd, handleDragCancel, handleDragEnd (+10) |
| `apps/web/src/shared/hooks/useCustomScrollbar.js` | applyThumbStyles, commitMetrics, computeThumbMetrics, handlePointerUp, setVisible (+8) |
| `apps/web/src/features/workspace/components/CardModal/utils/activityUtils.js` | buildActivitySidebarStorageKey, buildInitialActivitySnapshot, buildSidebarPanelStorageKey, formatCardCreatedLabel, readActivitySidebarOpenState (+8) |
| `hooks/gitnexus-hook.cjs` | extractPattern, main, parseRgGrepPattern, pickLongestStringValue, readInput (+6) |
| `apps/web/src/features/workspace/hooks/boardCollisionDetection.js` | createBoardDragCollisionState, createBoardCollisionDetection, getCardColumnId, getColumnCollisions, getColumnsByPointerX (+5) |
| `apps/web/src/features/workspace/hooks/boardDnDUtils.js` | findColumnIdForItem, isColumnId, columnCardStackDropId, applyDragOverToColumns, findCardIndex (+5) |
| `apps/web/src/features/workspace/components/CardModal/hooks/useCardModalAttachments.js` | handleViewportChange, openFilePicker, updateFilePickerPosition, useCardModalAttachments, handleAttachFile (+5) |
| `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardPlanner.js` | useKanbanBoardPlanner, persistPlannerPinnedState, togglePlannerPinned, formatDateLabel, plannerBaseItems (+4) |

## Entry Points

Start here when exploring this area:

- **`App`** (Function) — `apps/web/src/App.jsx:86`
- **`useAuth`** (Function) — `apps/web/src/features/auth/context/AuthContext.jsx:745`
- **`OAuthCallback`** (Function) — `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx:10`
- **`PasswordRecovery`** (Function) — `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx:18`
- **`readAuthIntent`** (Function) — `apps/web/src/features/auth/utils/authIntent.js:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `App` | Function | `apps/web/src/App.jsx` | 86 |
| `useAuth` | Function | `apps/web/src/features/auth/context/AuthContext.jsx` | 745 |
| `OAuthCallback` | Function | `apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx` | 10 |
| `PasswordRecovery` | Function | `apps/web/src/features/auth/pages/PasswordRecovery/PasswordRecovery.jsx` | 18 |
| `readAuthIntent` | Function | `apps/web/src/features/auth/utils/authIntent.js` | 11 |
| `readSessionModeFromAuthState` | Function | `apps/web/src/features/auth/utils/sessionMode.js` | 12 |
| `useCalendarEvents` | Function | `apps/web/src/features/calendar/hooks/useCalendarEvents.js` | 81 |
| `sectionDomId` | Function | `apps/web/src/features/docs/data/docsContent.js` | 421 |
| `DocsHomePage` | Function | `apps/web/src/features/docs/pages/DocsHomePage/DocsHomePage.jsx` | 94 |
| `DocsPage` | Function | `apps/web/src/features/docs/pages/DocsPage/DocsPage.jsx` | 877 |
| `goToSection` | Function | `apps/web/src/features/docs/pages/DocsPage/DocsPage.jsx` | 957 |
| `InfoPage` | Function | `apps/web/src/features/info/pages/InfoPage.jsx` | 3 |
| `AppThemeScope` | Function | `apps/web/src/features/preferences/components/AppThemeScope/AppThemeScope.jsx` | 67 |
| `PreferencesProvider` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 367 |
| `usePreferences` | Function | `apps/web/src/features/preferences/context/PreferencesContext.jsx` | 718 |
| `SettingsPage` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 130 |
| `handleSectionChange` | Function | `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx` | 2046 |
| `GridIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 3 |
| `ListIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 4 |
| `PlusIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 0 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RenderPlannerItem → InsertCardInOrder` | cross_community | 6 |
| `RenderPlannerItem → NormalizeTimeZone` | cross_community | 6 |
| `RenderPlannerItem → NormalizeCardDateLike` | cross_community | 6 |
| `RenderPlannerItem → UpdateColumns` | cross_community | 5 |
| `RenderPlannerItem → InsertCardInOrder` | cross_community | 5 |
| `DocsPage → GetSystemPrefersDark` | intra_community | 4 |
| `RenderPlannerItem → FindCardInColumns` | cross_community | 4 |
| `CardModal → NormalizeChecklist` | cross_community | 4 |
| `CardModal → ParseBrazilDateValue` | cross_community | 4 |
| `UploadLocalFileToCard → FetchImpl` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 38 calls |
| Context | 22 calls |
| Contracts | 10 calls |
| Config | 9 calls |
| DocsHomePage | 9 calls |
| Data | 4 calls |
| Icons | 4 calls |
| Workspace | 3 calls |

## How to Explore

1. `context({name: "App"})` — see callers and callees
2. `query({search_query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
