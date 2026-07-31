---
name: gitnexus-area-components
description: "Skill for the Components area of plan-things-2. 77 symbols across 30 files."
---

# Components

77 symbols | 30 files | Cohesion: 72%

## When to Use

- Working with code in `apps/`
- Understanding how BottomSheet, BottomTabs, handleChange work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/mobile/src/utils/calendarDateUtils.js` | buildMonthGrid, calendarDateFromDate, compareCalendarDates, isSameCalendarDate, isTodayCalendarDate (+4) |
| `apps/mobile/src/components/NewPlanSheet.js` | NewPlanSheet, collapse, isImageSelected, measureCollapsed, animateTo (+3) |
| `apps/mobile/src/components/CardModalRangeCalendar.js` | CalendarDayCell, getRangePosition, handleDayPress, monthDays, resolveNextRange (+2) |
| `apps/web/src/features/workspace/components/CardModal/components/CardModalActivitySidebar.jsx` | CardModalActivitySidebar, CardModalSidebarActivityPanel, CardModalSidebarChecklistPanel, CardModalSidebarGitHubPanel, CardModalSidebarPanelHeader (+1) |
| `apps/mobile/src/components/AuthenticatedAvatar.js` | imageSource, resolveImageSource, AuthenticatedAvatar, useNativeCachedUri, useWebObjectUrl |
| `apps/mobile/src/components/authenticatedAvatarSource.js` | resolveAuthenticatedAvatarUri, shouldFetchAuthenticatedAvatar, hashString, inferAvatarExtension, resolveAvatarCachePath |
| `apps/web/src/features/workspace/components/CardModal/utils/cardModalScheduleUtils.js` | formatCardScheduleSummary, formatScheduleDatePart, formatScheduleShortDate, normalizeCardScheduleTimeValue, snapCardScheduleTimeToSlot |
| `apps/mobile/src/components/BottomTabs.js` | BottomTabs, handleChange, createStyles, mutedLabelColor |
| `apps/mobile/src/components/AuthenticatedImage.js` | AuthenticatedImage, imageSource, useNativeCachedUri, useWebObjectUrl |
| `apps/mobile/src/theme/ThemeProvider.js` | useAppTheme, useThemedStyles |

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
| `DocsScreen` | Function | `apps/mobile/src/screens/DocsScreen.js` | 5 |
| `ProfileFilesTab` | Function | `apps/mobile/src/screens/profile/ProfileFilesTab.js` | 5 |
| `useAppTheme` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 99 |
| `useThemedStyles` | Function | `apps/mobile/src/theme/ThemeProvider.js` | 103 |
| `handleDayPress` | Function | `apps/mobile/src/components/CardModalRangeCalendar.js` | 122 |
| `monthDays` | Function | `apps/mobile/src/components/CardModalRangeCalendar.js` | 114 |
| `buildMonthGrid` | Function | `apps/mobile/src/utils/calendarDateUtils.js` | 105 |
| `calendarDateFromDate` | Function | `apps/mobile/src/utils/calendarDateUtils.js` | 84 |
| `compareCalendarDates` | Function | `apps/mobile/src/utils/calendarDateUtils.js` | 26 |
| `isSameCalendarDate` | Function | `apps/mobile/src/utils/calendarDateUtils.js` | 52 |
| `isTodayCalendarDate` | Function | `apps/mobile/src/utils/calendarDateUtils.js` | 96 |
| `CardModalActivitySidebar` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalActivitySidebar.jsx` | 433 |
| `CardModalChecklist` | Function | `apps/web/src/features/workspace/components/CardModal/components/CardModalChecklist.jsx` | 3 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `MobileKanbanBoard → UseMobileTheme` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Providers | 7 calls |
| Hooks | 4 calls |
| Screens | 2 calls |
| DateTime | 2 calls |
| NewPlanPopover | 1 calls |
| KanbanColumnStatusPicker | 1 calls |
| Calendar | 1 calls |
| CardModal | 1 calls |

## How to Explore

1. `context({name: "BottomSheet"})` — see callers and callees
2. `query({search_query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
