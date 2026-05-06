import { normalizeLibraryItem } from '../../../shared/contracts/fileContracts.js'

export const FILE_TYPES = {
  folder: { color: 'var(--filetype-folder-fg)', bg: 'var(--filetype-folder-bg)' },
  image: { color: 'var(--filetype-image-fg)', bg: 'var(--filetype-image-bg)' },
  pdf: { color: 'var(--filetype-pdf-fg)', bg: 'var(--filetype-pdf-bg)' },
  doc: { color: 'var(--filetype-doc-fg)', bg: 'var(--filetype-doc-bg)' },
  code: { color: 'var(--filetype-code-fg)', bg: 'var(--filetype-code-bg)' },
  zip: { color: 'var(--filetype-zip-fg)', bg: 'var(--filetype-zip-bg)' },
  generic: { color: 'var(--filetype-generic-fg)', bg: 'var(--filetype-generic-bg)' },
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
    name: 'Design do Produto',
    type: 'folder',
    modified: 'há 2h',
    starred: true,
    shared: true,
    children: [
      createLibraryItem({
        name: 'Componentes',
        type: 'folder',
        modified: 'há 1 dia',
        shared: true,
        children: [
          createLibraryItem({ name: 'estados-botao.fig', type: 'generic', size: 2380000, modified: 'Hoje', shared: true }),
          createLibraryItem({ name: 'anatomia-card.md', type: 'doc', size: 18600, modified: 'Ontem', owner: 'Ana R.' }),
        ],
      }),
      createLibraryItem({ name: 'Ícones', type: 'folder', modified: 'há 3 dias' }),
      createLibraryItem({ name: 'hero-mockup.png', type: 'image', size: 3100000, modified: 'há 2h', starred: true, shared: true }),
      createLibraryItem({ name: 'kanban-spec.pdf', type: 'pdf', size: 1240000, modified: 'Ontem', owner: 'Ana R.' }),
      createLibraryItem({ name: 'sistema-cores.json', type: 'code', size: 8200, modified: 'há 5 dias', shared: true }),
      createLibraryItem({ name: 'foto-capa.jpg', type: 'image', size: 2900000, modified: 'há 1 semana' }),
    ],
  }),
  createLibraryItem({
    name: 'Engenharia',
    type: 'folder',
    modified: 'Ontem',
    shared: true,
    children: [
      createLibraryItem({ name: 'api-spec-v2.md', type: 'doc', size: 86400, modified: 'Ontem', owner: 'Tom K.' }),
      createLibraryItem({ name: 'design-tokens.json', type: 'code', size: 14200, modified: 'há 5 dias' }),
      createLibraryItem({ name: 'vite.config.ts', type: 'code', size: 2100, modified: 'há 2 semanas' }),
      createLibraryItem({
        name: 'Frontend',
        type: 'folder',
        modified: 'Hoje',
        shared: true,
        children: [
          createLibraryItem({ name: 'mapa-rotas.json', type: 'code', size: 4100, modified: 'há 2h' }),
          createLibraryItem({ name: 'notas-app-shell.md', type: 'doc', size: 12400, modified: 'Hoje', shared: true }),
        ],
      }),
    ],
  }),
  createLibraryItem({
    name: 'Identidade da Marca 2025',
    type: 'folder',
    modified: 'há 3 dias',
    starred: true,
    children: [
      createLibraryItem({ name: 'diretrizes-marca.pdf', type: 'pdf', size: 6740000, modified: 'há 2 semanas', shared: true }),
      createLibraryItem({ name: 'exploracoes-logo.png', type: 'image', size: 2480000, modified: 'há 4 dias', starred: true }),
    ],
  }),
  createLibraryItem({ name: 'plano-lancamento-q3.pdf', type: 'pdf', size: 2480000, modified: 'Hoje', starred: true, shared: true }),
  createLibraryItem({ name: 'animacao-hero.gif', type: 'image', size: 4200000, modified: 'há 3 dias', shared: true }),
  createLibraryItem({ name: 'fluxo-onboarding.png', type: 'image', size: 1820000, modified: 'há 1 semana', starred: true, shared: true, owner: 'Ana R.' }),
  createLibraryItem({ name: 'app-bundle-v2.zip', type: 'zip', size: 18600000, modified: 'há 1 semana' }),
  createLibraryItem({ name: 'notas-reuniao-q3.doc', type: 'doc', size: 42000, modified: 'há 3 semanas', shared: true, owner: 'Sara M.' }),
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

export function restoreLibraryItem(items, targetId) {
  const restoreItem = (item) => normalizeLibraryItem({
    ...item,
    deleted: false,
    modified: 'Agora',
    children: (item.children || []).map(restoreItem),
  })

  return items.map((item) => {
    if (item.id === targetId) return restoreItem(item)
    if (item.type !== 'folder') return item

    return {
      ...item,
      children: restoreLibraryItem(item.children || [], targetId),
    }
  })
}

export function removeLibraryItem(items, targetId) {
  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      if (item.type !== 'folder') return item

      return {
        ...item,
        children: removeLibraryItem(item.children || [], targetId),
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
    modified: 'Agora',
  })
}
