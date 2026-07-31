---
name: gitnexus-area-aicomposercontextmenu
description: "Skill for the AiComposerContextMenu area of plan-things-2. 39 symbols across 6 files."
---

# AiComposerContextMenu

39 symbols | 6 files | Cohesion: 83%

## When to Use

- Working with code in `apps/`
- Understanding how AiComposerContextMenu, commitChips, handleViewportChange work
- Modifying aicomposercontextmenu-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | AiComposerContextMenu, CardMenuIcon, CheckIcon, ChevronIcon, ClipIcon (+18) |
| `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | createMockRecentAttachment, removeAttachmentChip, revokeAttachmentPreview, appendFilesAsAttachments, countAttachmentChips (+2) |
| `apps/web/src/features/intelligence/utils/uploadComposerAttachments.js` | findSourceFileForAttachment, uploadAttachment, uploadFile |
| `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.test.jsx` | contrastRatio, hexToRgb, relativeLuminance |
| `apps/web/src/shared/components/ComposerChip/composerChipPresentation.jsx` | CardChipIcon, buildCardContextChipType |
| `apps/web/src/shared/components/IntelligenceComposer/IntelligenceComposer.jsx` | handleRemoveAttachment |

## Entry Points

Start here when exploring this area:

- **`AiComposerContextMenu`** (Function) — `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx:106`
- **`commitChips`** (Function) — `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx:129`
- **`handleViewportChange`** (Function) — `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx:246`
- **`toggleChip`** (Function) — `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx:136`
- **`toggleRecentAttachment`** (Function) — `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx:144`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AiComposerContextMenu` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 106 |
| `commitChips` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 129 |
| `handleViewportChange` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 246 |
| `toggleChip` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 136 |
| `toggleRecentAttachment` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 144 |
| `updateFloatingSubmenuPosition` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 176 |
| `createMockRecentAttachment` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 122 |
| `removeAttachmentChip` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 46 |
| `revokeAttachmentPreview` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 41 |
| `CardChipIcon` | Function | `apps/web/src/shared/components/ComposerChip/composerChipPresentation.jsx` | 7 |
| `buildCardContextChipType` | Function | `apps/web/src/shared/components/ComposerChip/composerChipPresentation.jsx` | 2 |
| `handleRemoveAttachment` | Function | `apps/web/src/shared/components/IntelligenceComposer/IntelligenceComposer.jsx` | 143 |
| `uploadAttachment` | Function | `apps/web/src/features/intelligence/utils/uploadComposerAttachments.js` | 33 |
| `closeAll` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 174 |
| `handleFileInputChange` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 163 |
| `onKeyDown` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 221 |
| `onMouseDown` | Function | `apps/web/src/shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx` | 215 |
| `appendFilesAsAttachments` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 135 |
| `countAttachmentChips` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 37 |
| `isAttachmentChip` | Function | `apps/web/src/shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js` | 26 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AiComposerContextMenu → IsAttachmentChip` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SettingsPage | 1 calls |
| Components | 1 calls |
| UserChatMessage | 1 calls |
| ComposerAttachmentStrip | 1 calls |

## How to Explore

1. `context({name: "AiComposerContextMenu"})` — see callers and callees
2. `query({search_query: "aicomposercontextmenu"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
