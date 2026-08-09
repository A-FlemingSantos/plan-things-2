/** Must stay in sync with `.cmFilePicker` frame in KanbanBoard.module.css */
export const FILE_PICKER_DESKTOP_WIDTH = 468
export const FILE_PICKER_MOBILE_WIDTH = 312
export const FILE_PICKER_DESKTOP_HEIGHT = 520
export const FILE_PICKER_MOBILE_HEIGHT = 460
export const FILE_PICKER_DESKTOP_HEIGHT_VIEWPORT_OFFSET = 140
export const FILE_PICKER_MOBILE_HEIGHT_VIEWPORT_OFFSET = 96
export const FILE_PICKER_VIEWPORT_MARGIN = 16

/** @deprecated Use getFilePickerFrameSize().height — kept for callers expecting a constant. */
export const FILE_PICKER_FALLBACK_HEIGHT = FILE_PICKER_DESKTOP_HEIGHT

export const FILE_TYPE_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'image', label: 'Imagem' },
  { id: 'text', label: 'Texto' },
  { id: 'pdf', label: 'PDF' },
  { id: 'document', label: 'Documento' },
  { id: 'archive', label: 'Arquivo compactado' },
]

export function getFileExtension(name = '') {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

export function getFileCategory(file) {
  const extension = getFileExtension(file?.name)

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(extension)) {
    return { id: 'image', label: 'Imagem' }
  }

  if (['txt', 'md', 'csv', 'json', 'xml', 'log', 'ini', 'yml', 'yaml'].includes(extension)) {
    return { id: 'text', label: 'Texto' }
  }

  if (extension === 'pdf') {
    return { id: 'pdf', label: 'PDF' }
  }

  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods'].includes(extension)) {
    return { id: 'document', label: 'Documento' }
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { id: 'archive', label: 'Arquivo' }
  }

  return { id: 'all', label: 'Arquivo' }
}

export function resolveFilePickerAnchorElement(anchor) {
  if (!anchor) return null
  if (typeof Element !== 'undefined' && anchor instanceof Element) return anchor
  if (typeof Element !== 'undefined' && anchor.current instanceof Element) return anchor.current
  return null
}

export function getFilePickerFrameSize({
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
} = {}) {
  const isMobile = viewportWidth <= 768

  if (isMobile) {
    return {
      width: Math.min(FILE_PICKER_MOBILE_WIDTH, Math.max(0, viewportWidth - 20)),
      height: Math.min(FILE_PICKER_MOBILE_HEIGHT, Math.max(0, viewportHeight - FILE_PICKER_MOBILE_HEIGHT_VIEWPORT_OFFSET)),
    }
  }

  return {
    width: Math.min(FILE_PICKER_DESKTOP_WIDTH, Math.max(0, viewportWidth - 56)),
    height: Math.min(FILE_PICKER_DESKTOP_HEIGHT, Math.max(0, viewportHeight - FILE_PICKER_DESKTOP_HEIGHT_VIEWPORT_OFFSET)),
  }
}

export function computeFilePickerPosition({
  anchorRect,
  pickerHeight,
  pickerWidth: pickerWidthOverride,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
}) {
  if (!anchorRect) return null

  const frame = getFilePickerFrameSize({ viewportWidth, viewportHeight })
  const pickerWidth = pickerWidthOverride ?? frame.width
  const resolvedPickerHeight = pickerHeight ?? frame.height
  const minLeft = FILE_PICKER_VIEWPORT_MARGIN
  const maxLeft = Math.max(minLeft, viewportWidth - pickerWidth - FILE_PICKER_VIEWPORT_MARGIN)
  const leftAligned = anchorRect.left
  const rightAligned = anchorRect.right - pickerWidth
  // Prefer left-align to the trigger; if that overflows the viewport, right-align instead.
  const idealLeft = leftAligned <= maxLeft ? leftAligned : rightAligned
  const left = Math.min(Math.max(minLeft, idealLeft), maxLeft)
  const preferredTopBelow = anchorRect.bottom + 4
  const preferredTopAbove = anchorRect.top - resolvedPickerHeight - 4
  const minTop = FILE_PICKER_VIEWPORT_MARGIN
  const maxTop = Math.max(minTop, viewportHeight - resolvedPickerHeight - FILE_PICKER_VIEWPORT_MARGIN)

  let top = preferredTopBelow

  if (preferredTopBelow + resolvedPickerHeight > viewportHeight - FILE_PICKER_VIEWPORT_MARGIN) {
    top = preferredTopAbove >= minTop ? preferredTopAbove : maxTop
  }

  top = Math.min(Math.max(minTop, top), maxTop)

  return { top, left }
}

export function filterPickerFiles(sourceFiles, fileSearch, filePickerTypeFilter) {
  const query = fileSearch.trim().toLowerCase()

  return sourceFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(query)
    const category = getFileCategory(file)
    const matchesType = filePickerTypeFilter === 'all' || category.id === filePickerTypeFilter

    return matchesSearch && matchesType
  })
}

export function buildAttachedFileIds(attachments) {
  return new Set(attachments.map((attachment) => attachment.fileId))
}

export function getActiveFileTypeLabel(filePickerTypeFilter) {
  return FILE_TYPE_OPTIONS.find((option) => option.id === filePickerTypeFilter)?.label ?? 'Tipo'
}
