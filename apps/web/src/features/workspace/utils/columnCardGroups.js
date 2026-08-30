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
      endCardId: String(group.endCardId || group.startCardId),
      collapsed: Boolean(group.collapsed),
    }]
  })
}

export function createColumnGroup({ startCardId, endCardId, title = '', collapsed = false, id } = {}) {
  if (!startCardId) {
    return null
  }

  return {
    id: id ?? createColumnGroupId(),
    title: typeof title === 'string' ? title : '',
    startCardId: String(startCardId),
    endCardId: String(endCardId || startCardId),
    collapsed: Boolean(collapsed),
  }
}

export function resolveGroupEndCardId(cards, groups, startCardId) {
  if (!Array.isArray(cards) || !startCardId) {
    return startCardId ?? null
  }

  const start = cards.findIndex((card) => card.id === startCardId)
  if (start < 0) {
    return startCardId
  }

  const nextOccupied = normalizeColumnGroups(groups)
    .map((group) => cards.findIndex((card) => card.id === group.startCardId))
    .filter((index) => index > start)
    .sort((left, right) => left - right)[0]

  const end = nextOccupied == null ? cards.length - 1 : nextOccupied - 1
  return cards[Math.max(start, end)]?.id ?? startCardId
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

export function isCardInColumnGroup(cards, groups, cardId) {
  if (!cardId) {
    return false
  }

  return buildColumnListSegments(cards, groups).some((segment) => (
    segment.type === 'group' && segment.cards.some((card) => card.id === cardId)
  ))
}

export function canInsertColumnGroupAfter(cards, groups, afterCardId) {
  const startCardId = nextCardIdAfter(cards, afterCardId)
  if (!startCardId) {
    return false
  }

  if (isCardInColumnGroup(cards, groups, afterCardId) || isCardInColumnGroup(cards, groups, startCardId)) {
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

export function removeColumnGroup(columns, columnId, groupId) {
  if (!Array.isArray(columns) || !columnId || !groupId) {
    return columns
  }

  let hasChanges = false
  const nextColumns = columns.map((column) => {
    if (column.id !== columnId) {
      return column
    }

    const groups = normalizeColumnGroups(column.groups)
    const nextGroups = groups.filter((group) => group.id !== groupId)
    if (nextGroups.length === groups.length) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      groups: nextGroups,
    }
  })

  return hasChanges ? nextColumns : columns
}

export function buildColumnListSegments(cards, groups) {
  const cardList = Array.isArray(cards) ? cards : []
  const indexById = new Map(cardList.map((card, index) => [card.id, index]))
  const ranges = []

  for (const group of normalizeColumnGroups(groups)) {
    const start = indexById.get(group.startCardId)
    if (start == null) {
      continue
    }

    const endInclusive = indexById.has(group.endCardId)
      ? indexById.get(group.endCardId)
      : start
    ranges.push({
      group,
      start,
      end: Math.max(start, endInclusive) + 1,
    })
  }

  ranges.sort((left, right) => left.start - right.start || left.end - right.end)

  const segments = []
  let cursor = 0

  for (const range of ranges) {
    if (range.end <= cursor) {
      continue
    }

    const start = Math.max(range.start, cursor)
    if (start > cursor) {
      segments.push({
        type: 'loose',
        cards: cardList.slice(cursor, start),
      })
    }

    segments.push({
      type: 'group',
      group: range.group,
      cards: cardList.slice(start, range.end),
    })
    cursor = range.end
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
