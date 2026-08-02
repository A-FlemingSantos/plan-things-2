export const PLAN_TAGS = [
  { label: 'Engenharia',  color: 'var(--color-green)'  },
  { label: 'Design',      color: '#d4aef1'             },
  { label: 'Marketing',   color: 'var(--color-blue)'   },
  { label: 'Pesquisa',    color: '#f5a623'             },
  { label: 'Crescimento', color: 'var(--color-red)'    },
  { label: 'Operações',   color: '#a0a0a0'             },
]

export const COVER_THEMES = [
  { id: 'atelier', label: 'Atelier', cardCover: '#e7dcc3' },
  { id: 'neon', label: 'Neon', cardCover: '#dfe5ff' },
  { id: 'midnight', label: 'Midnight', cardCover: '#d9e6ff' },
  { id: 'ember', label: 'Ember', cardCover: '#f1d8d0' },
  { id: 'horizon', label: 'Horizon', cardCover: '#e8e2ff' },
  { id: 'frost', label: 'Frost', cardCover: '#dde8f8' },
]

function titleFromCollectionId(collectionId = '') {
  return String(collectionId)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildBackgroundCollectionsSnapshot() {
  const fullFiles = import.meta.glob('../../../../shared/assets/background-collections/**/*.{webp,png,jpg,jpeg,avif}', {
    eager: true,
    import: 'default',
  })
  const thumbFiles = import.meta.glob('../../../../shared/assets/background-collections-thumbs/**/*.{webp,png,jpg,jpeg,avif}', {
    eager: true,
    import: 'default',
  })

  const fullUrlById = Object.entries(fullFiles).reduce((acc, [path, url]) => {
    const normalized = String(path).replace(/\\/g, '/')
    const [, afterRoot = ''] = normalized.split('/background-collections/')
    if (!afterRoot) return acc
    acc[`background-collections/${afterRoot}`] = url
    return acc
  }, {})

  const items = Object.entries(thumbFiles).map(([path, url]) => {
    const normalized = String(path).replace(/\\/g, '/')
    const [, afterRoot = ''] = normalized.split('/background-collections-thumbs/')
    const [collectionId = 'Coleção', fileName = ''] = afterRoot.split('/')
    const id = `background-collections/${afterRoot}`
    return {
      id,
      url,
      fullUrl: fullUrlById[id] ?? null,
      collectionId,
      fileName,
      label: fileName.replace(/\.[^.]+$/, ''),
    }
  })

  const byCollection = items.reduce((acc, item) => {
    acc[item.collectionId] = acc[item.collectionId] ? [...acc[item.collectionId], item] : [item]
    return acc
  }, {})

  return Object.entries(byCollection)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([collectionId, collectionItems]) => ({
      id: collectionId,
      title: titleFromCollectionId(collectionId),
      items: collectionItems.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    }))
}

export const BACKGROUND_COLLECTIONS = buildBackgroundCollectionsSnapshot()
