import { useCallback, useState } from 'react'

function moveCardInColumns(columns, cardId, sourceColId, target) {
  const nextColumns = columns.map((column) => ({ ...column, cards: [...column.cards] }))
  const sourceColumn = nextColumns.find((column) => column.id === sourceColId)
  const card = sourceColumn?.cards.find((item) => item.id === cardId)

  if (!card) {
    return columns
  }

  sourceColumn.cards = sourceColumn.cards.filter((item) => item.id !== cardId)

  if (target.type === 'col') {
    const destinationColumn = nextColumns.find((column) => column.id === target.colId)

    if (!destinationColumn) {
      return columns
    }

    destinationColumn.cards.push(card)
    return nextColumns
  }

  const destinationColumn = nextColumns.find((column) => column.id === target.colId)

  if (!destinationColumn) {
    return columns
  }

  const targetIndex = destinationColumn.cards.findIndex((item) => item.id === target.cardId)

  if (targetIndex === -1) {
    destinationColumn.cards.push(card)
  } else {
    destinationColumn.cards.splice(targetIndex, 0, card)
  }

  return nextColumns
}

export function useBoardDragAndDrop({
  activePlanId,
  columns = [],
  updateColumns,
  moveCard,
  isBackendDriven = false,
  onMoveError,
}) {
  const [dragState, setDragState] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const handleDragStart = useCallback((cardId, sourceColId) => {
    setDragState({ cardId, sourceColId })
  }, [])

  const handleDragOver = useCallback((target) => {
    setDropTarget(target)
  }, [])

  const handleDrop = useCallback(async (target) => {
    if (!dragState || !activePlanId) return
    const { cardId, sourceColId } = dragState

    if (isBackendDriven) {
      const destinationColumn = columns.find((column) => column.id === target.colId)
      const sourceColumn = columns.find((column) => column.id === sourceColId)
      const sourceIndex = sourceColumn?.cards.findIndex((card) => card.id === cardId) ?? -1
      const destinationIndex = target.type === 'card'
        ? Math.max(0, destinationColumn?.cards.findIndex((card) => card.id === target.cardId) ?? 0)
        : (destinationColumn?.cards.length ?? 0)
      const sameColumnDrop = sourceColId === target.colId
      const targetPosition = sameColumnDrop && target.type === 'card' && sourceIndex > -1 && sourceIndex < destinationIndex
        ? Math.max(0, destinationIndex - 1)
        : destinationIndex

      const previousColumns = columns

      try {
        updateColumns((prev) => moveCardInColumns(prev, cardId, sourceColId, target))
        await moveCard(cardId, target.colId, targetPosition)
      } catch (error) {
        updateColumns(() => previousColumns)
        onMoveError?.(error)
      } finally {
        setDragState(null)
        setDropTarget(null)
      }
      return
    }

    updateColumns((prev) => moveCardInColumns(prev, cardId, sourceColId, target))

    setDragState(null)
    setDropTarget(null)
  }, [activePlanId, columns, dragState, isBackendDriven, moveCard, onMoveError, updateColumns])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
    setDropTarget(null)
  }, [])

  return {
    dragState,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  }
}
