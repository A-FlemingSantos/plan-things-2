import { arrayMove } from '@dnd-kit/sortable'

export const KANBAN_INBOX_DROP_ID = 'kanban-inbox-drop'

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
  const fromColumn = nextColumns.find((column) => column.id === fromColumnId)
  const toColumn = nextColumns.find((column) => column.id === toColumnId)

  if (!fromColumn || !toColumn) {
    return columns
  }

  const fromIndex = fromColumn.cards.findIndex((card) => card.id === cardId)
  if (fromIndex === -1) {
    return columns
  }

  const [card] = fromColumn.cards.splice(fromIndex, 1)
  const movedCard = card.columnId === toColumnId
    ? card
    : { ...card, columnId: toColumnId }

  const insertIndex = Math.max(0, Math.min(toIndex, toColumn.cards.length))
  toColumn.cards.splice(insertIndex, 0, movedCard)

  return nextColumns
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
