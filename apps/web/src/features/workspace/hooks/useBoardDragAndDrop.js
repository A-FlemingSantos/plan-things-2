import { useCallback, useState } from 'react'

export function useBoardDragAndDrop({ activePlanId, columns = [], updateColumns, moveCard, isBackendDriven = false }) {
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
      const targetPosition = target.type === 'card'
        ? Math.max(0, destinationColumn?.cards.findIndex((card) => card.id === target.cardId) ?? 0)
        : (destinationColumn?.cards.length ?? 0)
      await moveCard(cardId, target.colId, targetPosition)
      setDragState(null)
      setDropTarget(null)
      return
    }

    updateColumns((prev) => {
      const nextColumns = prev.map((column) => ({ ...column, cards: [...column.cards] }))
      const sourceColumn = nextColumns.find((column) => column.id === sourceColId)
      const card = sourceColumn?.cards.find((item) => item.id === cardId)

      if (!card) {
        return prev
      }

      sourceColumn.cards = sourceColumn.cards.filter((item) => item.id !== cardId)

      if (target.type === 'col') {
        const destinationColumn = nextColumns.find((column) => column.id === target.colId)

        if (!destinationColumn) {
          return prev
        }

        destinationColumn.cards.push(card)
        return nextColumns
      }

      const destinationColumn = nextColumns.find((column) => column.id === target.colId)

      if (!destinationColumn) {
        return prev
      }

      const targetIndex = destinationColumn.cards.findIndex((item) => item.id === target.cardId)

      if (targetIndex === -1) {
        destinationColumn.cards.push(card)
      } else {
        destinationColumn.cards.splice(targetIndex, 0, card)
      }

      return nextColumns
    })

    setDragState(null)
    setDropTarget(null)
  }, [activePlanId, columns, dragState, isBackendDriven, moveCard, updateColumns])

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
