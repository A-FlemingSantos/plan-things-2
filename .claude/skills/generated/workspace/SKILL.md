---
name: workspace
description: "Skill for the Workspace area of plan-things-2. 64 symbols across 15 files."
---

# Workspace

64 symbols | 15 files | Cohesion: 75%

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
| `apps/web/src/features/workspace/context/PlansContext.jsx` | deletePlan |
| `apps/web/src/shared/config/routes.js` | buildWorkspaceBoardPath |

## Entry Points

Start here when exploring this area:

- **`Navbar`** (Function) — `apps/web/src/features/landing/components/Navbar/Navbar.jsx:13`
- **`ColMenu`** (Function) — `apps/web/src/features/workspace/components/ColMenu/ColMenu.jsx:2`
- **`Workspace`** (Function) — `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx:1470`
- **`useCustomScrollbar`** (Function) — `apps/web/src/shared/hooks/useCustomScrollbar.js:4`
- **`stopDragging`** (Function) — `apps/web/src/shared/hooks/useCustomScrollbar.js:15`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `WorkspaceEntity` | Class | `services/api/src/main/java/com/planthings/api/workspace/WorkspaceEntity.java` | 10 |
| `Navbar` | Function | `apps/web/src/features/landing/components/Navbar/Navbar.jsx` | 13 |
| `ColMenu` | Function | `apps/web/src/features/workspace/components/ColMenu/ColMenu.jsx` | 2 |
| `Workspace` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1470 |
| `useCustomScrollbar` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 4 |
| `stopDragging` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 15 |
| `handlePointerUp` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 82 |
| `updateThumb` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 86 |
| `scheduleUpdate` | Function | `apps/web/src/shared/hooks/useCustomScrollbar.js` | 113 |
| `addEventListener` | Function | `apps/web/src/test/matchMedia.js` | 32 |
| `removeEventListener` | Function | `apps/web/src/test/matchMedia.js` | 35 |
| `deletePlan` | Function | `apps/web/src/features/workspace/context/PlansContext.jsx` | 173 |
| `handleDeletePlan` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1527 |
| `startInlineRename` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1548 |
| `handlePlanMenuAction` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1622 |
| `openBoard` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1667 |
| `buildWorkspaceBoardPath` | Function | `apps/web/src/shared/config/routes.js` | 132 |
| `pushNotification` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1507 |
| `handleNewPlan` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1518 |
| `cancelRename` | Function | `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx` | 1542 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreatePlan → WorkspaceEntity` | cross_community | 5 |
| `CreatePlan → SetOwnerUserId` | cross_community | 5 |
| `CreatePlan → GetId` | cross_community | 5 |
| `CreatePlan → SetName` | cross_community | 5 |
| `Refresh → WorkspaceEntity` | cross_community | 5 |
| `Refresh → SetOwnerUserId` | cross_community | 5 |
| `Refresh → GetId` | cross_community | 5 |
| `Me → WorkspaceEntity` | cross_community | 5 |
| `Me → SetOwnerUserId` | cross_community | 5 |
| `Me → GetId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Context | 7 calls |
| Files | 5 calls |
| Data | 2 calls |
| SettingsPage | 1 calls |
| Auth | 1 calls |
| Hooks | 1 calls |
| Settings | 1 calls |

## How to Explore

1. `gitnexus_context({name: "Navbar"})` — see callers and callees
2. `gitnexus_query({query: "workspace"})` — find related execution flows
3. Read key files listed above for implementation details
