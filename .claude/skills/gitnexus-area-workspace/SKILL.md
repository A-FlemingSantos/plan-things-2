---
name: gitnexus-area-workspace
description: "Skill for the Workspace area of plan-things-2. 43 symbols across 17 files."
---

# Workspace

43 symbols | 17 files | Cohesion: 60%

## When to Use

- Working with code in `apps/`
- Understanding how useIntelligenceComposerContext, LoadingPlanCard, GridIcon work
- Modifying workspace-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | Workspace, clearFileParam, renderPlanCollection, renderSectionHeader, renderWorkspacesSectionHeader (+10) |
| `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | GridIcon, ListIcon, PlusIcon, SearchIcon |
| `services/api/src/main/java/com/planthings/api/workspace/WorkspaceEntity.java` | WorkspaceEntity, setOwnerUserId, setSubscriptionPlan, setName |
| `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | InviteAccept, LogoMark, loadInvite |
| `apps/web/src/shared/hooks/useTransientNotification.js` | clearNotificationTimer, pushNotification, useTransientNotification |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | usePlans, deletePlan |
| `services/api/src/main/java/com/planthings/api/workspace/WorkspaceService.java` | requireName, updateCurrentWorkspaceName |
| `apps/web/src/features/intelligence/hooks/useIntelligenceComposerContext.js` | useIntelligenceComposerContext |
| `apps/web/src/features/workspace/components/LoadingPlanCard/LoadingPlanCard.jsx` | LoadingPlanCard |
| `apps/web/src/features/workspace/components/WorkspaceIntelligenceSection/WorkspaceIntelligenceSection.jsx` | WorkspaceIntelligenceSection |

## Entry Points

Start here when exploring this area:

- **`useIntelligenceComposerContext`** (Function) — `apps/web/src/features/intelligence/hooks/useIntelligenceComposerContext.js:17`
- **`LoadingPlanCard`** (Function) — `apps/web/src/features/workspace/components/LoadingPlanCard/LoadingPlanCard.jsx:2`
- **`GridIcon`** (Function) — `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx:3`
- **`ListIcon`** (Function) — `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx:4`
- **`PlusIcon`** (Function) — `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx:0`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `WorkspaceEntity` | Class | `services/api/src/main/java/com/planthings/api/workspace/WorkspaceEntity.java` | 10 |
| `useIntelligenceComposerContext` | Function | `apps/web/src/features/intelligence/hooks/useIntelligenceComposerContext.js` | 17 |
| `LoadingPlanCard` | Function | `apps/web/src/features/workspace/components/LoadingPlanCard/LoadingPlanCard.jsx` | 2 |
| `GridIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 3 |
| `ListIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 4 |
| `PlusIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 0 |
| `SearchIcon` | Function | `apps/web/src/features/workspace/components/WorkspaceIcons/WorkspaceIcons.jsx` | 2 |
| `WorkspaceIntelligenceSection` | Function | `apps/web/src/features/workspace/components/WorkspaceIntelligenceSection/WorkspaceIntelligenceSection.jsx` | 9 |
| `WorkspaceLoadingState` | Function | `apps/web/src/features/workspace/components/WorkspaceLoadingState/WorkspaceLoadingState.jsx` | 3 |
| `WorkspaceSectionActions` | Function | `apps/web/src/features/workspace/components/WorkspaceSectionActions/WorkspaceSectionActions.jsx` | 3 |
| `usePlans` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 477 |
| `InviteAccept` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 19 |
| `loadInvite` | Function | `apps/web/src/features/workspace/pages/InviteAccept/InviteAccept.jsx` | 51 |
| `Workspace` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 34 |
| `clearFileParam` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 116 |
| `renderPlanCollection` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 356 |
| `renderSectionHeader` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 419 |
| `renderWorkspacesSectionHeader` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 429 |
| `uploadPlanCoverFile` | Function | `apps/web/src/features/workspace/components/workspaceCover/workspaceCoverUtils.js` | 22 |
| `useKanbanBoardNotification` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/hooks/useKanbanBoardNotification.js` | 2 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateConversation → SetOwnerUserId` | cross_community | 5 |
| `CreateConversation → GetId` | cross_community | 5 |
| `CreateConversation → SetName` | cross_community | 5 |
| `CreateConversation → GetFullName` | cross_community | 5 |
| `CreatePlan → SetOwnerUserId` | cross_community | 5 |
| `CreatePlan → GetId` | cross_community | 5 |
| `CreatePlan → SetName` | cross_community | 5 |
| `CreatePlan → GetFullName` | cross_community | 5 |
| `Refresh → SetOwnerUserId` | cross_community | 5 |
| `Refresh → GetId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 11 calls |
| Files | 5 calls |
| Hooks | 4 calls |
| SettingsPage | 4 calls |
| Data | 2 calls |
| PlanBackgroundPicker | 2 calls |
| Board | 1 calls |
| IntelligenceComposer | 1 calls |

## How to Explore

1. `context({name: "useIntelligenceComposerContext"})` — see callers and callees
2. `query({search_query: "workspace"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
