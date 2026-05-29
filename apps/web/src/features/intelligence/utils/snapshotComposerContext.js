import { partitionComposerChips } from '../../../shared/components/ComposerAttachmentStrip/composerAttachmentUtils.js'

function cloneAttachmentChip(chip) {
  return {
    id: chip.id,
    type: chip.type,
    kind: chip.kind,
    label: chip.label,
    isImage: chip.isImage,
    previewUrl: chip.previewUrl ?? null,
    mimeType: chip.mimeType ?? null,
    isMock: chip.isMock ?? false,
  }
}

function cloneInlineChip(chip) {
  return {
    id: chip.id,
    type: chip.type,
    kind: chip.kind,
    label: chip.label,
    ChipIcon: chip.ChipIcon,
  }
}

/**
 * Immutable snapshot of composer context at send time.
 * Attachments and inline chips are copied; blob preview URLs are preserved.
 */
export function snapshotComposerContext(chips) {
  const { attachments, inlineChips } = partitionComposerChips(chips)
  const imageAttachments = attachments.filter((chip) => chip.isImage).map(cloneAttachmentChip)
  const fileAttachments = attachments.filter((chip) => !chip.isImage).map(cloneAttachmentChip)

  return {
    imageAttachments,
    fileAttachments,
    contextChips: inlineChips.map(cloneInlineChip),
  }
}

export function hasComposerContext(chips) {
  const { attachments, inlineChips } = partitionComposerChips(chips)
  return attachments.length > 0 || inlineChips.length > 0
}

/** Removes file attachments from the composer while keeping inline context chips. */
export function keepComposerInlineChips(chips) {
  return partitionComposerChips(chips).inlineChips
}

export function hasContextSnapshot(snapshot) {
  if (!snapshot) return false
  return (
    snapshot.imageAttachments?.length > 0
    || snapshot.fileAttachments?.length > 0
    || snapshot.contextChips?.length > 0
  )
}
