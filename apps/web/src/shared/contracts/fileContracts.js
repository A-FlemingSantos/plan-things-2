import { createClientId } from '../utils/createClientId.js'

export function normalizeLibraryItem(item = {}) {
  const type = item.type ?? (Array.isArray(item.children) ? 'folder' : 'generic')
  const normalized = {
    id: item.id ?? createClientId(type === 'folder' ? 'folder' : 'file'),
    name: item.name ?? 'Sem título',
    type,
    size: Number.isFinite(item.size) ? item.size : 0,
    modified: item.modified ?? 'Agora',
    starred: Boolean(item.starred),
    shared: Boolean(item.shared),
    owner: item.owner ?? 'me',
    deleted: Boolean(item.deleted),
  }

  if (type === 'folder') {
    normalized.children = Array.isArray(item.children) ? item.children.map(normalizeLibraryItem) : []
  }

  return {
    ...item,
    ...normalized,
  }
}

