export const MAX_COMPOSER_ATTACHMENTS = 5

const SQUARE_PREVIEW_SIZE = 112

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
  const id = `file-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    label: file.name,
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
  const currentAttachments = countAttachmentChips(chips)
  let remainingSlots = MAX_COMPOSER_ATTACHMENTS - currentAttachments
  if (remainingSlots <= 0) return chips

  let nextChips = [...chips]

  for (const file of files) {
    if (remainingSlots <= 0) break

    const attachment = await createAttachmentFromFile(file)
    if (nextChips.some((chip) => chip.type === attachment.type)) continue

    nextChips = [...nextChips, attachment]
    remainingSlots -= 1
  }

  return nextChips
}
