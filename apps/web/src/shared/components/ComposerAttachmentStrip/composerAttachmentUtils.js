export const MAX_COMPOSER_ATTACHMENTS = 5

export const ATTACHMENT_LAYOUT = {
  fullImageSize: 56,
  compactImageSize: 40,
  fileMaxWidth: 220,
  fileBaseWidth: 54,
  charWidth: 6.5,
  gap: 8,
}

const SQUARE_PREVIEW_SIZE = 112

function normalizeAttachmentFileName(file) {
  const name = typeof file?.name === 'string' ? file.name.trim() : ''
  return name || 'untitled'
}

function buildAttachmentFingerprint(file) {
  const name = normalizeAttachmentFileName(file).toLowerCase()
  const mimeType = typeof file?.type === 'string' ? file.type.toLowerCase() : ''
  const size = Number.isFinite(file?.size) ? file.size : 0
  const lastModified = Number.isFinite(file?.lastModified) ? file.lastModified : 0

  return `${name}::${mimeType}::${size}::${lastModified}`
}

function buildAttachmentType(file) {
  const base = buildAttachmentFingerprint(file)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return `file-upload-${base || 'file'}`
}

export function isAttachmentChip(chip) {
  return chip?.kind === 'file'
}

export function partitionComposerChips(chips) {
  const normalized = Array.isArray(chips) ? chips : []
  const attachments = normalized.filter(isAttachmentChip)
  const inlineChips = normalized.filter((chip) => !isAttachmentChip(chip))
  return { attachments, inlineChips }
}

export function countAttachmentChips(chips) {
  return partitionComposerChips(chips).attachments.length
}

export function revokeAttachmentPreview(chip) {
  if (!chip?.previewUrl?.startsWith('blob:')) return
  URL.revokeObjectURL(chip.previewUrl)
}

export function removeAttachmentChip(chips, type) {
  const target = chips.find((chip) => chip.type === type)
  if (target) revokeAttachmentPreview(target)
  return chips.filter((chip) => chip.type !== type)
}

function createSquareImagePreviewUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const side = Math.min(image.naturalWidth, image.naturalHeight)
      const sx = (image.naturalWidth - side) / 2
      const sy = (image.naturalHeight - side) / 2
      const canvas = document.createElement('canvas')
      canvas.width = SQUARE_PREVIEW_SIZE
      canvas.height = SQUARE_PREVIEW_SIZE

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      context.drawImage(image, sx, sy, side, side, 0, 0, SQUARE_PREVIEW_SIZE, SQUARE_PREVIEW_SIZE)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image preview'))
            return
          }
          resolve(URL.createObjectURL(blob))
        },
        file.type || 'image/png',
        0.92,
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    image.src = objectUrl
  })
}

export async function createAttachmentFromFile(file) {
  const id = buildAttachmentType(file)
  const isImage = file.type.startsWith('image/')
  let previewUrl = null

  if (isImage) {
    try {
      previewUrl = await createSquareImagePreviewUrl(file)
    } catch {
      previewUrl = URL.createObjectURL(file)
    }
  }

  return {
    id: `ctx-${id}`,
    type: id,
    kind: 'file',
    label: normalizeAttachmentFileName(file),
    isImage,
    previewUrl,
    mimeType: file.type,
  }
}

export function createMockRecentAttachment({ id, name, type }) {
  const chipType = `file-${id}`
  return {
    id: `ctx-${chipType}`,
    type: chipType,
    kind: 'file',
    label: name,
    isImage: type === 'image',
    previewUrl: null,
    isMock: true,
  }
}

export async function appendFilesAsAttachments(chips, files) {
  const normalizedChips = Array.isArray(chips) ? chips : []
  const currentAttachments = countAttachmentChips(normalizedChips)
  let remainingSlots = MAX_COMPOSER_ATTACHMENTS - currentAttachments
  if (remainingSlots <= 0) return normalizedChips

  const existingTypes = new Set(
    partitionComposerChips(normalizedChips).attachments.map((attachment) => attachment.type),
  )
  let nextChips = normalizedChips

  for (const file of files) {
    if (remainingSlots <= 0) break

    const attachment = await createAttachmentFromFile(file)
    if (existingTypes.has(attachment.type)) continue

    existingTypes.add(attachment.type)
    nextChips = nextChips === normalizedChips
      ? [...normalizedChips, attachment]
      : [...nextChips, attachment]
    remainingSlots -= 1
  }

  return nextChips
}

function clipboardImageExtension(mimeType) {
  const subtype = mimeType?.split('/')?.[1] ?? 'png'
  if (subtype === 'jpeg') return 'jpg'
  return subtype
}

export function getImageFilesFromClipboard(clipboardData) {
  if (!clipboardData) return []

  const files = []
  const seen = new Set()

  for (const item of Array.from(clipboardData.items ?? [])) {
    if (item.kind !== 'file') continue
    if (!item.type.startsWith('image/')) continue

    const blob = item.getAsFile()
    if (!blob) continue

    const dedupeKey = `${blob.type}:${blob.size}:${blob.lastModified ?? 0}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const hasUsableName = typeof blob.name === 'string' && blob.name.trim().length > 0
    const name = hasUsableName
      ? blob.name.trim()
      : `clipboard-image-${files.length + 1}.${clipboardImageExtension(blob.type)}`

    files.push(
      blob instanceof File && blob.name === name
        ? blob
        : new File([blob], name, {
          type: blob.type || 'image/png',
          lastModified: Number.isFinite(blob.lastModified) ? blob.lastModified : 0,
        }),
    )
  }

  return files
}

export async function appendClipboardImagesAsAttachments(chips, clipboardData) {
  const normalizedChips = Array.isArray(chips) ? chips : []
  const imageFiles = getImageFilesFromClipboard(clipboardData)
  if (imageFiles.length === 0) {
    return { chips: normalizedChips, handled: false }
  }

  const nextChips = await appendFilesAsAttachments(normalizedChips, imageFiles)
  return {
    chips: nextChips,
    handled: nextChips !== normalizedChips,
  }
}

export function estimateAttachmentItemWidth(attachment, compact = false) {
  if (attachment?.isImage) {
    return compact
      ? ATTACHMENT_LAYOUT.compactImageSize
      : ATTACHMENT_LAYOUT.fullImageSize
  }

  const label = String(attachment?.label ?? '')
  const estimated = ATTACHMENT_LAYOUT.fileBaseWidth + label.length * ATTACHMENT_LAYOUT.charWidth
  return Math.min(ATTACHMENT_LAYOUT.fileMaxWidth, estimated)
}

export function estimateAttachmentsRowWidth(attachments, compact = false) {
  if (!Array.isArray(attachments) || attachments.length === 0) return 0

  return attachments.reduce((total, attachment, index) => {
    const itemWidth = estimateAttachmentItemWidth(attachment, compact)
    return total + itemWidth + (index > 0 ? ATTACHMENT_LAYOUT.gap : 0)
  }, 0)
}

export function measureAttachmentInlineSize(strip) {
  if (!strip?.isConnected) return 0

  const computedStyle = window.getComputedStyle(strip)
  const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0
  const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0
  const rawWidth = strip.clientWidth || strip.getBoundingClientRect().width || 0

  return Math.max(0, Math.round(rawWidth - paddingLeft - paddingRight))
}

export function countAttachmentRows(container) {
  if (!container?.children?.length) return 0

  const rowTops = []
  for (const child of container.children) {
    const top = Math.round(child.getBoundingClientRect().top)
    const matchesExistingRow = rowTops.some(
      (existingTop) => Math.abs(existingTop - top) <= 2,
    )

    if (!matchesExistingRow) {
      rowTops.push(top)
    }
  }

  return rowTops.length
}

export function shouldUseCompactAttachmentLayout(
  rowsAtFullSize,
  rowsAtCompactSize,
  isCurrentlyCompact = false,
) {
  if (isCurrentlyCompact) {
    return rowsAtCompactSize > 1
  }

  if (rowsAtFullSize <= 1) {
    return false
  }

  return rowsAtCompactSize > 1
}

export function resolveCompactAttachmentLayout(strip, attachments = [], isCurrentlyCompact = false) {
  if (!strip?.isConnected || !strip.children?.length) {
    return false
  }

  const availableWidth = measureAttachmentInlineSize(strip)
  if (availableWidth <= 0) {
    return false
  }

  const fullWouldWrap = estimateAttachmentsRowWidth(attachments, false) > availableWidth + 1
  const compactWouldWrap = estimateAttachmentsRowWidth(attachments, true) > availableWidth + 1

  if (isCurrentlyCompact) {
    return shouldUseCompactAttachmentLayout(
      fullWouldWrap ? 2 : 1,
      compactWouldWrap ? 2 : 1,
      true,
    )
  }

  const rowsAtFullSize = countAttachmentRows(strip)

  return shouldUseCompactAttachmentLayout(
    rowsAtFullSize,
    compactWouldWrap ? 2 : 1,
    false,
  )
}
