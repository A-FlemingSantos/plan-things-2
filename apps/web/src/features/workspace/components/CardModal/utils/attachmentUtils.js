export const FILE_PICKER_DESKTOP_WIDTH = 680
export const FILE_PICKER_MOBILE_WIDTH = 360
export const FILE_PICKER_FALLBACK_HEIGHT = 360
export const FILE_PICKER_VIEWPORT_MARGIN = 16

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

export function computeFilePickerPosition({
  anchorRect,
  pickerHeight,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
}) {
  if (!anchorRect) return null

  const pickerWidth = viewportWidth <= 768
    ? Math.min(FILE_PICKER_MOBILE_WIDTH, viewportWidth - 40)
    : Math.min(FILE_PICKER_DESKTOP_WIDTH, viewportWidth - 64)
  const minLeft = FILE_PICKER_VIEWPORT_MARGIN
  const maxLeft = Math.max(minLeft, viewportWidth - pickerWidth - FILE_PICKER_VIEWPORT_MARGIN)
  const idealLeft = anchorRect.left
  const left = Math.min(Math.max(minLeft, idealLeft), maxLeft)
  const preferredTopBelow = anchorRect.bottom + 4
  const preferredTopAbove = anchorRect.top - pickerHeight - 4
  const minTop = FILE_PICKER_VIEWPORT_MARGIN
  const maxTop = Math.max(minTop, viewportHeight - pickerHeight - FILE_PICKER_VIEWPORT_MARGIN)

  let top = preferredTopBelow

  if (preferredTopBelow + pickerHeight > viewportHeight - FILE_PICKER_VIEWPORT_MARGIN) {
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
