import { getFileTypeFromName } from '../../../../files/data/libraryRepository.js'

export function mapApiFileItem(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    modified: item.updatedAt?.text ?? item.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: Boolean(item.sharedByCurrentUser),
    canUnshare: Boolean(item.canUnshare),
  }
}

export function mapApiAttachmentItem(item) {
  return {
    id: item.id,
    fileId: item.fileId,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    attachedBy: item.attachedBy ?? null,
    attachedByCurrentUser: Boolean(item.attachedByCurrentUser),
    canRemove: Boolean(item.canRemove),
    createdAt: item.createdAt ?? null,
  }
}

export function mapAttachmentToFileItem(attachment) {
  return {
    id: attachment.fileId,
    name: attachment.name,
    type: attachment.type,
    mimeType: attachment.mimeType ?? '',
    size: attachment.size ?? 0,
    modified: attachment.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: true,
    canUnshare: true,
  }
}

export function upsertFileItem(items, nextItem) {
  if (!Array.isArray(items) || !nextItem?.id) {
    return items
  }

  const existingIndex = items.findIndex((item) => item.id === nextItem.id)
  if (existingIndex < 0) {
    return [...items, nextItem]
  }

  const currentItem = items[existingIndex]
  const mergedItem = { ...currentItem, ...nextItem }
  const hasChanges = Object.keys(mergedItem).some((key) => mergedItem[key] !== currentItem[key])
  if (!hasChanges) {
    return items
  }

  const nextItems = [...items]
  nextItems[existingIndex] = mergedItem
  return nextItems
}
