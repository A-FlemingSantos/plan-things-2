import { normalizeLibraryItem } from '../../../shared/contracts/fileContracts.js'

export const FILE_TYPES = {
  folder: { color: '#f5a623', bg: '#fff8ed' },
  image: { color: '#4290da', bg: '#f0f7ff' },
  pdf: { color: '#d94f4f', bg: '#fff4f4' },
  doc: { color: '#0f703a', bg: '#f0fbf4' },
  code: { color: '#9b7ec8', bg: '#f7f3ff' },
  zip: { color: '#a0a0a0', bg: '#f5f5f5' },
  generic: { color: '#a0a0a0', bg: '#f5f5f5' },
}

export function getFileTypeFromName(name) {
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
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function createLibraryItem(data) {
  return normalizeLibraryItem(data)
}

const INITIAL_LIBRARY = [
  createLibraryItem({
    name: 'Product Design',
    type: 'folder',
    modified: '2 hours ago',
    starred: true,
    shared: true,
    children: [
      createLibraryItem({
        name: 'Components',
        type: 'folder',
        modified: '1 day ago',
        shared: true,
        children: [
          createLibraryItem({ name: 'Button states.fig', type: 'generic', size: 2380000, modified: 'Today', shared: true }),
          createLibraryItem({ name: 'Card anatomy.md', type: 'doc', size: 18600, modified: 'Yesterday', owner: 'Ana R.' }),
        ],
      }),
      createLibraryItem({ name: 'Icons', type: 'folder', modified: '3 days ago' }),
      createLibraryItem({ name: 'hero-mockup.png', type: 'image', size: 3100000, modified: '2 hours ago', starred: true, shared: true }),
      createLibraryItem({ name: 'kanban-spec.pdf', type: 'pdf', size: 1240000, modified: 'Yesterday', owner: 'Ana R.' }),
      createLibraryItem({ name: 'color-system.json', type: 'code', size: 8200, modified: '5 days ago', shared: true }),
      createLibraryItem({ name: 'cover-photo.jpg', type: 'image', size: 2900000, modified: '1 week ago' }),
    ],
  }),
  createLibraryItem({
    name: 'Engineering',
    type: 'folder',
    modified: 'Yesterday',
    shared: true,
    children: [
      createLibraryItem({ name: 'API Spec v2.md', type: 'doc', size: 86400, modified: 'Yesterday', owner: 'Tom K.' }),
      createLibraryItem({ name: 'Design Tokens.json', type: 'code', size: 14200, modified: '5 days ago' }),
      createLibraryItem({ name: 'vite.config.ts', type: 'code', size: 2100, modified: '2 weeks ago' }),
      createLibraryItem({
        name: 'Frontend',
        type: 'folder',
        modified: 'Today',
        shared: true,
        children: [
          createLibraryItem({ name: 'routes-map.json', type: 'code', size: 4100, modified: '2 hours ago' }),
          createLibraryItem({ name: 'app-shell-notes.md', type: 'doc', size: 12400, modified: 'Today', shared: true }),
        ],
      }),
    ],
  }),
  createLibraryItem({
    name: 'Brand Identity 2025',
    type: 'folder',
    modified: '3 days ago',
    starred: true,
    children: [
      createLibraryItem({ name: 'Brand Guidelines.pdf', type: 'pdf', size: 6740000, modified: '2 weeks ago', shared: true }),
      createLibraryItem({ name: 'Logo explorations.png', type: 'image', size: 2480000, modified: '4 days ago', starred: true }),
    ],
  }),
  createLibraryItem({ name: 'Q3 Launch Plan.pdf', type: 'pdf', size: 2480000, modified: 'Today', starred: true, shared: true }),
  createLibraryItem({ name: 'Hero Animation.gif', type: 'image', size: 4200000, modified: '3 days ago', shared: true }),
  createLibraryItem({ name: 'Onboarding Flow.png', type: 'image', size: 1820000, modified: '1 week ago', starred: true, shared: true, owner: 'Ana R.' }),
  createLibraryItem({ name: 'app-bundle-v2.zip', type: 'zip', size: 18600000, modified: '1 week ago' }),
  createLibraryItem({ name: 'Meeting Notes Q3.doc', type: 'doc', size: 42000, modified: '3 weeks ago', shared: true, owner: 'Sara M.' }),
]

export function createInitialLibrarySnapshot() {
  return INITIAL_LIBRARY.map((item) => normalizeLibraryItem(item))
}

export function pathsMatch(left, right) {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

export function flattenLibrary(items, pathIds = [], inheritedDeleted = false) {
  return items.flatMap((item) => {
    const children = item.children || []
    const isDeletedTree = inheritedDeleted || item.deleted
    const flatItem = {
      ...item,
      pathIds,
      isDeletedTree,
    }

    return [
      flatItem,
      ...(item.type === 'folder' ? flattenLibrary(children, [...pathIds, item.id], isDeletedTree) : []),
    ]
  })
}

export function updateLibraryItem(items, targetId, updater) {
  return items.map((item) => {
    if (item.id === targetId) return normalizeLibraryItem(updater(item))
    if (item.type !== 'folder') return item

    return {
      ...item,
      children: updateLibraryItem(item.children || [], targetId, updater),
    }
  })
}

export function insertLibraryItem(items, pathIds, newItem) {
  if (pathIds.length === 0) return [normalizeLibraryItem(newItem), ...items]

  const [currentId, ...restPath] = pathIds

  return items.map((item) => {
    if (item.id !== currentId || item.type !== 'folder') return item

    return {
      ...item,
      children: insertLibraryItem(item.children || [], restPath, newItem),
    }
  })
}

export function markLibraryItemDeleted(item) {
  return normalizeLibraryItem({
    ...item,
    deleted: true,
    modified: 'Just now',
  })
}
