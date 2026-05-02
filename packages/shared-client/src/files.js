import { createClientId } from './ids.js'

export function getFileTypeFromName(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  if (!ext || name === ext) return 'folder'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'doc'
  if (['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'json', 'py'].includes(ext)) return 'code'
  if (['zip', 'rar', 'gz', 'tar'].includes(ext)) return 'zip'
  return 'generic'
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function normalizeLibraryItem(item = {}) {
  const type = item.type ?? (Array.isArray(item.children) ? 'folder' : 'generic')
  const normalized = {
    id: item.id ?? createClientId(type === 'folder' ? 'folder' : 'file'),
    name: item.name ?? 'Sem titulo',
    type,
    size: Number.isFinite(item.size) ? item.size : 0,
    modified: item.modified ?? 'Agora',
    starred: Boolean(item.starred),
    favorite: Boolean(item.favorite ?? item.starred),
    shared: Boolean(item.shared),
    owner: item.owner ?? 'me',
    deleted: Boolean(item.deleted),
    trashed: Boolean(item.trashed ?? item.deleted),
  }

  if (type === 'folder') {
    normalized.children = Array.isArray(item.children) ? item.children.map(normalizeLibraryItem) : []
  }

  return { ...item, ...normalized }
}

export function mapApiFileItem(item = {}) {
  const isFolder = item.type === 'FOLDER'
  const type = isFolder ? 'folder' : getFileTypeFromName(item.name)

  return normalizeLibraryItem({
    id: item.id,
    name: item.name,
    type,
    size: item.sizeBytes ?? 0,
    sizeLabel: formatFileSize(item.sizeBytes ?? 0),
    modified: item.updatedAt?.text ?? item.createdAt?.text ?? 'Agora',
    modifiedAtIso: item.updatedAt?.iso ?? item.createdAt?.iso ?? null,
    createdAtIso: item.createdAt?.iso ?? null,
    starred: Boolean(item.starred),
    favorite: Boolean(item.starred),
    owner: 'me',
    deleted: Boolean(item.deleted),
    trashed: Boolean(item.deleted),
    parentId: item.parentId ?? null,
    shared: Boolean(item.sharedByCurrentUser || item.canUnshare),
    sharedByCurrentUser: Boolean(item.sharedByCurrentUser),
    canUnshare: Boolean(item.canUnshare),
    raw: item,
  })
}

export function buildLibraryTreeFromApi(items = []) {
  const normalized = items.map(mapApiFileItem)
  const byId = new Map(normalized.map((item) => [item.id, { ...item, children: item.type === 'folder' ? [] : undefined }]))
  const roots = []

  normalized.forEach((item) => {
    const current = byId.get(item.id)
    const parentId = item.parentId
    if (parentId) {
      const parent = byId.get(parentId)
      if (parent?.type === 'folder') parent.children = [...(parent.children ?? []), current]
      return
    }
    roots.push(current)
  })

  return roots
}
