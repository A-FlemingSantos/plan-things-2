---
name: cardmodal
description: "Skill for the CardModal area of plan-things-2. 50 symbols across 2 files."
---

# CardModal

50 symbols | 2 files | Cohesion: 73%

## When to Use

- Working with code in `apps/`
- Understanding how formatFileSize, CardModal, cancelTitleEdit work
- Modifying cardmodal-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | formatCalendarInputValue, buildCalendarDays, formatCalendarMonthLabel, buildInitials, getChecklistAssigneeName (+44) |
| `apps/web/src/features/files/data/libraryRepository.js` | formatFileSize |

## Entry Points

Start here when exploring this area:

- **`formatFileSize`** (Function) — `apps/web/src/features/files/data/libraryRepository.js:23`
- **`CardModal`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:272`
- **`cancelTitleEdit`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:596`
- **`updateFilePickerPosition`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:717`
- **`openFilePicker`** (Function) — `apps/web/src/features/workspace/components/CardModal/CardModal.jsx:750`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatFileSize` | Function | `apps/web/src/features/files/data/libraryRepository.js` | 23 |
| `CardModal` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 272 |
| `cancelTitleEdit` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 596 |
| `updateFilePickerPosition` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 717 |
| `openFilePicker` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 750 |
| `handleAttachFile` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 768 |
| `handleRemoveAttachment` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 790 |
| `getMemberName` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 1201 |
| `pickerFiles` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 1231 |
| `getCommentPresenter` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 1241 |
| `handleViewportChange` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 1355 |
| `resetChecklistItemDraft` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 429 |
| `closeChecklistComposer` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 442 |
| `handleChecklistCreate` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 855 |
| `handleChecklistDelete` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 894 |
| `handleChecklistItemAdd` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 920 |
| `toggleChecklistItem` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 1019 |
| `updateSaveStatus` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 449 |
| `buildNextCard` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 467 |
| `hasOverride` | Function | `apps/web/src/features/workspace/components/CardModal/CardModal.jsx` | 468 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Screens | 2 calls |
| Workspace | 2 calls |

## How to Explore

1. `gitnexus_context({name: "formatFileSize"})` — see callers and callees
2. `gitnexus_query({query: "cardmodal"})` — find related execution flows
3. Read key files listed above for implementation details
