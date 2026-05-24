---
name: components
description: "Skill for the Components area of plan-things-2. 22 symbols across 10 files."
---

# Components

22 symbols | 10 files | Cohesion: 75%

## When to Use

- Working with code in `apps/`
- Understanding how BottomSheet, BottomTabs, handleChange work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/components/AuthenticatedAvatar.js` | useWebObjectUrl, useNativeCachedUri, AuthenticatedAvatar, resolveImageSource, imageSource |
| `apps/mobile/src/components/authenticatedAvatarSource.js` | inferAvatarExtension, hashString, resolveAvatarCachePath, shouldFetchAuthenticatedAvatar, resolveAuthenticatedAvatarUri |
| `apps/mobile/src/components/BottomSheet.js` | BottomSheet, close, onPanResponderRelease |
| `apps/mobile/src/components/BottomTabs.js` | BottomTabs, handleChange |
| `apps/mobile/src/components/WorkspaceIconBadge.js` | normalizeWorkspaceIconKey, WorkspaceIconBadge |
| `apps/mobile/src/components/LogoMark.js` | LogoMark |
| `apps/mobile/src/components/ScreenHeader.js` | ScreenHeader |
| `apps/mobile/src/components/TaskRow.js` | TaskRow |
| `apps/mobile/src/screens/AppShell.js` | AppShell |
| `apps/mobile/src/theme/ThemeProvider.js` | useThemedStyles |

## Entry Points

Start here when exploring this area:

- **`BottomSheet`** (Function) — `apps/mobile/src/components/BottomSheet.js:7`
- **`BottomTabs`** (Function) — `apps/mobile/src/components/BottomTabs.js:17`
- **`handleChange`** (Function) — `apps/mobile/src/components/BottomTabs.js:20`
- **`LogoMark`** (Function) — `apps/mobile/src/components/LogoMark.js:4`
- **`ScreenHeader`** (Function) — `apps/mobile/src/components/ScreenHeader.js:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BottomSheet` | Function | `apps/mobile/src/components/BottomSheet.js` | 7 |
| `BottomTabs` | Function | `apps/mobile/src/components/BottomTabs.js` | 17 |
| `handleChange` | Function | `apps/mobile/src/components/BottomTabs.js` | 20 |
| `LogoMark` | Function | `apps/mobile/src/components/LogoMark.js` | 4 |
| `ScreenHeader` | Function | `apps/mobile/src/components/ScreenHeader.js` | 5 |
| `TaskRow` | Function | `apps/mobile/src/components/TaskRow.js` | 5 |
| `AppShell` | Function | `apps/mobile/src/screens/AppShell.js` | 25 |
| `useThemedStyles` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 103 |
| `AuthenticatedAvatar` | Function | `apps/mobile/src/components/AuthenticatedAvatar.js` | 132 |
| `resolveAvatarCachePath` | Function | `apps/mobile/src/components/authenticatedAvatarSource.js` | 33 |
| `imageSource` | Function | `apps/mobile/src/components/AuthenticatedAvatar.js` | 144 |
| `shouldFetchAuthenticatedAvatar` | Function | `apps/mobile/src/components/authenticatedAvatarSource.js` | 22 |
| `resolveAuthenticatedAvatarUri` | Function | `apps/mobile/src/components/authenticatedAvatarSource.js` | 26 |
| `close` | Function | `apps/mobile/src/components/BottomSheet.js` | 31 |
| `onPanResponderRelease` | Function | `apps/mobile/src/components/BottomSheet.js` | 48 |
| `normalizeWorkspaceIconKey` | Function | `apps/mobile/src/components/WorkspaceIconBadge.js` | 16 |
| `WorkspaceIconBadge` | Function | `apps/mobile/src/components/WorkspaceIconBadge.js` | 25 |
| `useWebObjectUrl` | Function | `apps/mobile/src/components/AuthenticatedAvatar.js` | 22 |
| `useNativeCachedUri` | Function | `apps/mobile/src/components/AuthenticatedAvatar.js` | 68 |
| `inferAvatarExtension` | Function | `apps/mobile/src/components/authenticatedAvatarSource.js` | 2 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Providers | 2 calls |
| Theme | 1 calls |

## How to Explore

1. `gitnexus_context({name: "BottomSheet"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
