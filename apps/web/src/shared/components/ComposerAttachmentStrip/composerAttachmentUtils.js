export const MAX_COMPOSER_ATTACHMENTS = 5

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
