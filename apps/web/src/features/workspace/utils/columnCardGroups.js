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
    if (!group?.id) {
      return []
    }

    const id = String(group.id)
    if (seenIds.has(id)) {
      return []
    }

    seenIds.add(id)

    return [{
      id,
      uiKey: typeof group.uiKey === 'string' && group.uiKey ? group.uiKey : `group-ui-${id}`,
      title: typeof group.title === 'string' ? group.title : '',
      startCardId: group.startCardId ? String(group.startCardId) : null,
      endCardId: group.endCardId ? String(group.endCardId) : (group.startCardId ? String(group.startCardId) : null),
      cardIds: Array.from(new Set(
        Array.isArray(group.cardIds) ? group.cardIds.filter(Boolean).map(String) : [],
      )),
      collapsed: Boolean(group.collapsed),
    }]
  })
}

export function createColumnGroup({ startCardId, endCardId, cardIds, title = '', collapsed = false, id, uiKey } = {}) {
  const normalizedCardIds = Array.from(new Set(
    Array.isArray(cardIds) ? cardIds.filter(Boolean).map(String) : [startCardId].filter(Boolean).map(String),
  ))
  if (!normalizedCardIds.length) {
    return null
  }

  const nextId = id ?? createColumnGroupId()
  return {
    id: nextId,
    uiKey: uiKey ?? `group-ui-${nextId}`,
    title: typeof title === 'string' ? title : '',
    startCardId: String(startCardId || normalizedCardIds[0]),
    endCardId: String(endCardId || normalizedCardIds.at(-1)),
    cardIds: normalizedCardIds,
    collapsed: Boolean(collapsed),
  }
}

export function resolveGroupEndCardId(cards, groups, startCardId) {
  return collectInitialGroupCardIds(cards, groups, startCardId).at(-1) ?? startCardId ?? null
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

  return !normalizeColumnGroups(groups).some((group) => group.cardIds.includes(startCardId))
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
      groups: normalizeColumnGroups(column.groups).map((group) => {
        if (group.id !== previousGroupId) {
          return group
        }
        return createColumnGroup({ ...nextGroup, uiKey: group.uiKey })
      }),
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
  const groupsByCardId = new Map()
  for (const group of normalizeColumnGroups(groups)) {
    for (const cardId of groupCardIds(cardList, group)) {
      groupsByCardId.set(cardId, group)
    }
  }
  const segments = []
  const renderedGroupIds = new Set()
  for (const card of cardList) {
    const candidateGroup = groupsByCardId.get(card.id) ?? null
    const previous = segments.at(-1)
    const continuesPreviousGroup = Boolean(
      candidateGroup
      && previous?.type === 'group'
      && previous.group.id === candidateGroup.id,
    )
    const group = candidateGroup && (!renderedGroupIds.has(candidateGroup.id) || continuesPreviousGroup)
      ? candidateGroup
      : null

    if (group && previous?.type === 'group' && previous.group.id === group.id) {
      previous.cards.push(card)
      continue
    }
    if (!group && previous?.type === 'loose') {
      previous.cards.push(card)
      continue
    }

    if (group) {
      renderedGroupIds.add(group.id)
    }

    segments.push(group
      ? { type: 'group', group, cards: [card] }
      : { type: 'loose', cards: [card] })
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

export function collectInitialGroupCardIds(cards, groups, startCardId) {
  const cardList = Array.isArray(cards) ? cards : []
  const start = cardList.findIndex((card) => card.id === startCardId)
  if (start < 0 || isCardInColumnGroup(cardList, groups, startCardId)) {
    return []
  }
  const result = []
  for (let index = start; index < cardList.length; index += 1) {
    const cardId = cardList[index].id
    if (isCardInColumnGroup(cardList, groups, cardId)) {
      break
    }
    result.push(cardId)
  }
  return result
}

function groupCardIds(cards, group) {
  if (group.cardIds.length) {
    return group.cardIds
  }
  // Compatibility only for responses from an API that has not yet run V32.
  const start = cards.findIndex((card) => card.id === group.startCardId)
  const end = cards.findIndex((card) => card.id === group.endCardId)
  if (start < 0) {
    return []
  }
  return cards.slice(start, end < start ? start + 1 : end + 1).map((card) => card.id)
}
