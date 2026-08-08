---
name: gitnexus-area-components
description: "Skill for the Components area of plan-things-2. 103 symbols across 38 files."
---

# Components

103 symbols | 38 files | Cohesion: 75%

## When to Use

- Working with code in `apps/`
- Understanding how BottomSheet, BottomTabs, handleChange work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/utils/calendarDateUtils.js` | buildMonthGrid, calendarDateFromDate, compareCalendarDates, isSameCalendarDate, isTodayCalendarDate (+4) |
| `apps/mobile/src/components/NewPlanSheet.js` | NewPlanSheet, collapse, isImageSelected, measureCollapsed, animateTo (+3) |
| `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubItemBody.jsx` | CardModalGitHubItemBody, CommitBody, DiffStatRow, IssueBody, ItemDescription (+2) |
| `apps/mobile/src/components/CardModalRangeCalendar.js` | CalendarDayCell, getRangePosition, handleDayPress, monthDays, resolveNextRange (+2) |
| `apps/mobile/src/components/AuthenticatedAvatar.js` | imageSource, resolveImageSource, AuthenticatedAvatar, useNativeCachedUri, useWebObjectUrl |
| `apps/mobile/src/components/authenticatedAvatarSource.js` | resolveAuthenticatedAvatarUri, shouldFetchAuthenticatedAvatar, hashString, inferAvatarExtension, resolveAvatarCachePath |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalActivitySidebar.jsx` | CardModalSidebarChecklistPanel, CardModalSidebarActivityPanel, CardModalSidebarFilesPanel, CardModalActivitySidebar, CardModalSidebarPanelHeader |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalScheduleUtils.js` | formatCardScheduleSummary, formatScheduleDatePart, formatScheduleShortDate, normalizeCardScheduleTimeValue, snapCardScheduleTimeToSlot |
| `apps/mobile/src/components/BottomTabs.js` | BottomTabs, handleChange, createStyles, mutedLabelColor |
| `apps/mobile/src/components/AuthenticatedImage.js` | AuthenticatedImage, imageSource, useNativeCachedUri, useWebObjectUrl |

## Entry Points

Start here when exploring this area:

- **`BottomSheet`** (Function) — `apps/mobile/src/components/BottomSheet.js:7`
- **`BottomTabs`** (Function) — `apps/mobile/src/components/BottomTabs.js:28`
- **`handleChange`** (Function) — `apps/mobile/src/components/BottomTabs.js:33`
- **`LogoMark`** (Function) — `apps/mobile/src/components/LogoMark.js:4`
- **`ScreenHeader`** (Function) — `apps/mobile/src/components/ScreenHeader.js:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BottomSheet` | Function | `apps/mobile/src/components/BottomSheet.js` | 7 |
| `BottomTabs` | Function | `apps/mobile/src/components/BottomTabs.js` | 28 |
| `handleChange` | Function | `apps/mobile/src/components/BottomTabs.js` | 33 |
| `LogoMark` | Function | `apps/mobile/src/components/LogoMark.js` | 4 |
| `ScreenHeader` | Function | `apps/mobile/src/components/ScreenHeader.js` | 5 |
| `TaskRow` | Function | `apps/mobile/src/components/TaskRow.js` | 5 |
| `AppShell` | Function | `apps/mobile/src/screens/AppShell.js` | 38 |
| `AuthScreen` | Function | `apps/mobile/src/screens/AuthScreen.js` | 164 |
| `DocsScreen` | Function | `apps/mobile/src/screens/DocsScreen.js` | 5 |
| `InboxScreen` | Function | `apps/mobile/src/screens/InboxScreen.js` | 9 |
| `ProfileFilesTab` | Function | `apps/mobile/src/screens/profile/ProfileFilesTab.js` | 5 |
| `useAppTheme` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 99 |
| `useMobileTheme` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 91 |
| `useThemedStyles` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 103 |
| `CardModalActivityGitHubLink` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalActivityGitHubLink.jsx` | 17 |
| `CardModalActivityPreview` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalActivityPreview.jsx` | 53 |
| `CardModalGitHubItemBody` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubItemBody.jsx` | 158 |
| `CardModalGitHubLinkItem` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubLinkItem.jsx` | 48 |
| `GitHubExternalLinkGlyph` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/githubIcons.jsx` | 87 |
| `GitHubObjectIcon` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/githubIcons.jsx` | 78 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MobileKanbanBoard → UseMobileTheme` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Hooks | 10 calls |
| Providers | 9 calls |
| CardModal | 4 calls |
| DateTime | 2 calls |
| NewPlanPopover | 1 calls |
| Services | 1 calls |
| Github | 1 calls |
| Calendar | 1 calls |

## How to Explore

1. `context({name: "BottomSheet"})` — see callers and callees
2. `query({search_query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
