import { arrayMove } from '@dnd-kit/sortable'

export const KANBAN_INBOX_DROP_ID = 'kanban-inbox-drop'

export function columnCardStackDropId(columnId) {
  return `${columnId}::card-stack`
}

export function columnGroupBeforeDropId(columnId, groupId) {
  return `${columnId}::group-before::${groupId}`
}

function parseColumnGroupBeforeDropId(itemId) {
  const [columnId, marker, groupId] = String(itemId ?? '').split('::')
  return marker === 'group-before' && columnId && groupId
    ? { columnId, groupId }
    : null
}

export function isColumnId(columns, id) {
  return columns.some((column) => column.id === id)
}

export function findColumnIdForItem(columns, itemId) {
  if (!itemId) return null
  if (isColumnId(columns, itemId)) return itemId

  const groupBoundary = parseColumnGroupBeforeDropId(itemId)
  if (groupBoundary && isColumnId(columns, groupBoundary.columnId)) {
    return groupBoundary.columnId
  }

  const column = columns.find((col) => col.cards.some((card) => card.id === itemId))
  if (column) return column.id

  return null
}

export function findCardIndex(columns, columnId, cardId) {
  const column = columns.find((col) => col.id === columnId)
  if (!column) return -1
  return column.cards.findIndex((card) => card.id === cardId)
}

export function moveCardToIndex(columns, cardId, fromColumnId, toColumnId, toIndex) {
  const nextColumns = columns.map((column) => ({ ...column, cards: [...column.cards] }))
  const toColumn = nextColumns.find((column) => column.id === toColumnId)

  if (!toColumn) {
    return columns
  }

  let movedCard = null

  for (const column of nextColumns) {
    const cardIndex = column.cards.findIndex((card) => card.id === cardId)
    if (cardIndex === -1) {
      continue
    }

    if (!movedCard) {
      ;[movedCard] = column.cards.splice(cardIndex, 1)
      continue
    }

    column.cards.splice(cardIndex, 1)
  }

  if (!movedCard) {
    return columns
  }

  const nextCard = movedCard.columnId === toColumnId
    ? movedCard
    : { ...movedCard, columnId: toColumnId }

  const insertIndex = Math.max(0, Math.min(toIndex, toColumn.cards.length))
  toColumn.cards.splice(insertIndex, 0, nextCard)

  return nextColumns
}

function groupMemberIds(column, group) {
  if (Array.isArray(group?.cardIds) && group.cardIds.length) {
    return group.cardIds.map(String)
  }

  const start = column.cards.findIndex((card) => card.id === group?.startCardId)
  const end = column.cards.findIndex((card) => card.id === group?.endCardId)
  if (start < 0) {
    return []
  }

  return column.cards
    .slice(start, end < start ? start + 1 : end + 1)
    .map((card) => card.id)
}

export function applyCardDropToColumns(
  columns,
  cardId,
  fromColumnId,
  toColumnId,
  targetPosition,
  targetGroupId,
) {
  const membersByGroupId = new Map()
  for (const column of columns) {
    for (const group of column.groups ?? []) {
      membersByGroupId.set(group.id, groupMemberIds(column, group))
    }
  }

  const reorderedColumns = moveCardToIndex(
    columns,
    cardId,
    fromColumnId,
    toColumnId,
    targetPosition,
  )

  return reorderedColumns.map((column) => {
    const nextGroups = (column.groups ?? []).flatMap((group) => {
      const memberIds = (membersByGroupId.get(group.id) ?? [])
        .filter((memberId) => memberId !== cardId)
      if (column.id === toColumnId && group.id === targetGroupId) {
        memberIds.push(cardId)
      }

      const memberIdSet = new Set(memberIds)
      const orderedMemberIds = column.cards
        .filter((card) => memberIdSet.has(card.id))
        .map((card) => card.id)
      if (!orderedMemberIds.length) {
        return []
      }

      return [{
        ...group,
        startCardId: orderedMemberIds[0],
        endCardId: orderedMemberIds.at(-1),
        cardIds: orderedMemberIds,
      }]
    })

    return {
      ...column,
      groups: nextGroups,
    }
  })
}

export function applyDragOverToColumns(columns, columnIds, activeId, overId) {
  if (!overId || activeId === overId || overId === KANBAN_INBOX_DROP_ID) {
    return { columns, overColumnId: null, changed: false }
  }

  const activeColumnId = findColumnIdForItem(columns, activeId)
  const overColumnId = findColumnIdForItem(columns, overId)

  if (!activeColumnId || !overColumnId) {
    return { columns, overColumnId: null, changed: false }
  }

  const activeIndex = findCardIndex(columns, activeColumnId, activeId)
  if (activeIndex === -1) {
    return { columns, overColumnId, changed: false }
  }

  const overIndex = resolveOverIndex(columns, columnIds, overId, overColumnId)
  if (overIndex === -1) {
    return { columns, overColumnId, changed: false }
  }

  if (activeColumnId === overColumnId) {
    if (activeIndex === overIndex) {
      return { columns, overColumnId, changed: false }
    }

    const nextColumns = reorderCardWithinColumn(
      columns,
      activeColumnId,
      activeIndex,
      overIndex,
    )

    return { columns: nextColumns, overColumnId, changed: true }
  }

  const currentIndexInTarget = findCardIndex(columns, overColumnId, activeId)
  if (currentIndexInTarget === overIndex) {
    return { columns, overColumnId, changed: false }
  }

  const nextColumns = moveCardToIndex(
    columns,
    activeId,
    activeColumnId,
    overColumnId,
    overIndex,
  )

  return { columns: nextColumns, overColumnId, changed: true }
}

export function reorderCardWithinColumn(columns, columnId, activeIndex, overIndex) {
  if (activeIndex === overIndex || activeIndex < 0 || overIndex < 0) {
    return columns
  }

  return columns.map((column) => {
    if (column.id !== columnId) {
      return column
    }

    return {
      ...column,
      cards: arrayMove(column.cards, activeIndex, overIndex),
    }
  })
}

export function reorderColumnsByDrag(columns, activeColumnId, overColumnId) {
  if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
    return { columns, changed: false }
  }

  const oldIndex = columns.findIndex((column) => column.id === activeColumnId)
  const newIndex = columns.findIndex((column) => column.id === overColumnId)

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return { columns, changed: false }
  }

  return {
    columns: arrayMove(columns, oldIndex, newIndex),
    changed: true,
  }
}

export function resolveOverIndex(columns, columnIds, overId, overColumnId) {
  if (columnIds.includes(overId)) {
    const overColumn = columns.find((column) => column.id === overColumnId)
    return overColumn?.cards.length ?? 0
  }

  const groupBoundary = parseColumnGroupBeforeDropId(overId)
  if (groupBoundary && groupBoundary.columnId === overColumnId) {
    const group = columns
      .find((column) => column.id === overColumnId)
      ?.groups
      ?.find((item) => item.id === groupBoundary.groupId)
    const firstMemberId = group?.cardIds?.[0] ?? group?.startCardId
    return firstMemberId
      ? findCardIndex(columns, overColumnId, firstMemberId)
      : -1
  }

  return findCardIndex(columns, overColumnId, overId)
}

/**
 * @deprecated Use moveCardToIndex with an explicit insert index.
 */
export function moveCardInColumns(columns, cardId, sourceColId, target) {
  if (target.type === 'col') {
    const destinationColumn = columns.find((column) => column.id === target.colId)
    const insertIndex = destinationColumn?.cards.length ?? 0
    return moveCardToIndex(columns, cardId, sourceColId, target.colId, insertIndex)
  }

  const destinationColumn = columns.find((column) => column.id === target.colId)
  const insertIndex = destinationColumn?.cards.findIndex((card) => card.id === target.cardId) ?? -1

  if (insertIndex === -1) {
    const fallbackIndex = destinationColumn?.cards.length ?? 0
    return moveCardToIndex(columns, cardId, sourceColId, target.colId, fallbackIndex)
  }

  return moveCardToIndex(columns, cardId, sourceColId, target.colId, insertIndex)
}
