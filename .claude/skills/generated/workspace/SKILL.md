---
name: workspace
description: "Skill for the Workspace area of plan-things-2. 64 symbols across 15 files."
---

# Workspace

64 symbols | 15 files | Cohesion: 77%

## When to Use

- Working with code in `apps/`
- Understanding how Navbar, ColMenu, Workspace work
- Modifying workspace-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | resolveCoverThemeClass, NewPlanPopover, updatePosition, clamp, resolvePlanBackgroundPickerPosition (+34) |
| `apps/web/src/shared/hooks/useCustomScrollbar.js` | useCustomScrollbar, stopDragging, handlePointerUp, updateThumb, scheduleUpdate |
| `services/api/src/main/java/com/planthings/api/workspace/WorkspaceEntity.java` | WorkspaceEntity, setOwnerUserId, setSubscriptionPlan, setName |
| `services/api/src/main/java/com/planthings/api/workspace/StorageQuotaProperties.java` | getBasicBytes, getProfessionalBytes, getTeamBytes |
| `apps/web/src/test/matchMedia.js` | addEventListener, removeEventListener |
| `services/api/src/main/java/com/planthings/api/workspace/WorkspaceService.java` | updateCurrentWorkspaceName, requireName |
| `apps/web/src/features/landing/components/Navbar/Navbar.jsx` | Navbar |
| `apps/web/src/features/workspace/components/ColMenu/ColMenu.jsx` | ColMenu |
| `services/api/src/main/java/com/planthings/api/intelligence/persistence/AiMessageBlockEntity.java` | setPosition |
| `apps/web/src/features/workspace/context/PlansContext.jsx` | deletePlan |

## Entry Points

Start here when exploring this area:

- **`Navbar`** (Function) — `apps/web/src/features/landing/components/Navbar/Navbar.jsx:13`
- **`ColMenu`** (Function) — `apps/web/src/features/workspace/components/ColMenu/ColMenu.jsx:2`
- **`Workspace`** (Function) — `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx:1470`
- **`startInlineRename`** (Function) — `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx:1548`
- **`handlePlanMenuAction`** (Function) — `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx:1622`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `WorkspaceEntity` | Class | `services/api/src/main/java/com/planthings/api/workspace/WorkspaceEntity.java` | 10 |
| `Navbar` | Function | `apps/web/src/features/landing/components/Navbar/Navbar.jsx` | 13 |
| `ColMenu` | Function | `apps/web/src/features/workspace/components/ColMenu/ColMenu.jsx` | 2 |
| `Workspace` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1470 |
| `startInlineRename` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1548 |
| `handlePlanMenuAction` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1622 |
| `openBoard` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1667 |
| `useCustomScrollbar` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 4 |
| `stopDragging` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 15 |
| `handlePointerUp` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 82 |
| `updateThumb` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 86 |
| `scheduleUpdate` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 113 |
| `addEventListener` | Function | `apps/web/src/test/matchMedia.js` | 32 |
| `removeEventListener` | Function | `apps/web/src/test/matchMedia.js` | 35 |
| `deletePlan` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 173 |
| `pushNotification` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1507 |
| `handleNewPlan` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1518 |
| `handleDeletePlan` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1527 |
| `cancelRename` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1542 |
| `commitInlineRename` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1556 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateConversation → WorkspaceEntity` | cross_community | 5 |
| `CreateConversation → SetOwnerUserId` | cross_community | 5 |
| `CreateConversation → GetId` | cross_community | 5 |
| `CreateConversation → SetName` | cross_community | 5 |
| `CreatePlan → WorkspaceEntity` | cross_community | 5 |
| `CreatePlan → SetOwnerUserId` | cross_community | 5 |
| `CreatePlan → GetId` | cross_community | 5 |
| `CreatePlan → SetName` | cross_community | 5 |
| `Refresh → WorkspaceEntity` | cross_community | 5 |
| `Refresh → SetOwnerUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 7 calls |
| Files | 6 calls |
| SettingsPage | 2 calls |
| Data | 2 calls |
| Auth | 1 calls |
| Hooks | 1 calls |

## How to Explore

1. `gitnexus_context({name: "Navbar"})` — see callers and callees
2. `gitnexus_query({query: "workspace"})` — find related execution flows
3. Read key files listed above for implementation details
