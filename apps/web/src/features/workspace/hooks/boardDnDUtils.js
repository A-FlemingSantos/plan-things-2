import { arrayMove } from '@dnd-kit/sortable'

export const KANBAN_INBOX_DROP_ID = 'kanban-inbox-drop'

export function columnCardStackDropId(columnId) {
  return `${columnId}::card-stack`
}

export function isColumnId(columns, id) {
  return columns.some((column) => column.id === id)
}

export function findColumnIdForItem(columns, itemId) {
  if (!itemId) return null
  if (isColumnId(columns, itemId)) return itemId

  const column = columns.find((col) => col.cards.some((card) => card.id === itemId))
  return column?.id ?? null
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

export function resolveOverIndex(columns, columnIds, overId, overColumnId) {
  if (columnIds.includes(overId)) {
    const overColumn = columns.find((column) => column.id === overColumnId)
    return overColumn?.cards.length ?? 0
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
