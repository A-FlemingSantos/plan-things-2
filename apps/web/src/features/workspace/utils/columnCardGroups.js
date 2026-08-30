export function createColumnGroupId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `group-${Math.random().toString(36).slice(2, 11)}`
}

export function normalizeColumnGroups(groups) {
  if (!Array.isArray(groups)) {
    return []
  }

  const seenIds = new Set()

  return groups.flatMap((group) => {
    if (!group?.id || !group.startCardId) {
      return []
    }

    const id = String(group.id)
    if (seenIds.has(id)) {
      return []
    }

    seenIds.add(id)

    return [{
      id,
      title: typeof group.title === 'string' ? group.title : '',
      startCardId: String(group.startCardId),
      collapsed: Boolean(group.collapsed),
    }]
  })
}

export function createColumnGroup({ startCardId, title = '', collapsed = false, id } = {}) {
  if (!startCardId) {
    return null
  }

  return {
    id: id ?? createColumnGroupId(),
    title: typeof title === 'string' ? title : '',
    startCardId: String(startCardId),
    collapsed: Boolean(collapsed),
  }
}

export function nextCardIdAfter(cards, afterCardId) {
  if (!Array.isArray(cards) || !afterCardId) {
    return null
  }

  const index = cards.findIndex((card) => card.id === afterCardId)
  if (index < 0 || index >= cards.length - 1) {
    return null
  }

  return cards[index + 1]?.id ?? null
}

export function canInsertColumnGroupAfter(cards, groups, afterCardId) {
  const startCardId = nextCardIdAfter(cards, afterCardId)
  if (!startCardId) {
    return false
  }

  return !normalizeColumnGroups(groups).some((group) => group.startCardId === startCardId)
}

export function upsertColumnGroup(columns, columnId, group) {
  if (!Array.isArray(columns) || !columnId || !group?.id || !group.startCardId) {
    return columns
  }

  let hasChanges = false
  const nextGroup = createColumnGroup(group)
  const nextColumns = columns.map((column) => {
    if (column.id !== columnId) {
      return column
    }

    const groups = normalizeColumnGroups(column.groups)
    const existingIndex = groups.findIndex((item) => item.id === nextGroup.id)
    const nextGroups = existingIndex >= 0
      ? groups.map((item, index) => (index === existingIndex ? { ...item, ...nextGroup } : item))
      : [...groups.filter((item) => item.startCardId !== nextGroup.startCardId), nextGroup]

    hasChanges = true
    return {
      ...column,
      groups: nextGroups,
    }
  })

  return hasChanges ? nextColumns : columns
}

export function replaceColumnGroupId(columns, columnId, previousGroupId, nextGroup) {
  if (!Array.isArray(columns) || !columnId || !previousGroupId || !nextGroup?.id) {
    return columns
  }

  return columns.map((column) => {
    if (column.id !== columnId) {
      return column
    }

    return {
      ...column,
      groups: normalizeColumnGroups(column.groups).map((group) => (
        group.id === previousGroupId ? { ...group, ...createColumnGroup(nextGroup) } : group
      )),
    }
  })
}

export function buildColumnListSegments(cards, groups) {
  const cardList = Array.isArray(cards) ? cards : []
  const indexById = new Map(cardList.map((card, index) => [card.id, index]))
  const orderedGroups = []
  const usedStarts = new Set()

  for (const group of normalizeColumnGroups(groups)) {
    if (!indexById.has(group.startCardId) || usedStarts.has(group.startCardId)) {
      continue
    }

    usedStarts.add(group.startCardId)
    orderedGroups.push(group)
  }

  orderedGroups.sort((left, right) => indexById.get(left.startCardId) - indexById.get(right.startCardId))

  const segments = []
  let cursor = 0

  for (const group of orderedGroups) {
    const start = indexById.get(group.startCardId)
    if (start > cursor) {
      segments.push({
        type: 'loose',
        cards: cardList.slice(cursor, start),
      })
    }

    const nextStart = orderedGroups
      .map((item) => indexById.get(item.startCardId))
      .find((index) => index > start)
    const end = nextStart ?? cardList.length

    segments.push({
      type: 'group',
      group,
      cards: cardList.slice(start, end),
    })
    cursor = end
  }

  if (cursor < cardList.length) {
    segments.push({
      type: 'loose',
      cards: cardList.slice(cursor),
    })
  }

  return segments
}

export function collapsedCardIdsFromGroups(cards, groups) {
  const hidden = new Set()

  for (const segment of buildColumnListSegments(cards, groups)) {
    if (segment.type !== 'group' || !segment.group.collapsed) {
      continue
    }

    for (const card of segment.cards) {
      hidden.add(card.id)
    }
  }

  return hidden
}
