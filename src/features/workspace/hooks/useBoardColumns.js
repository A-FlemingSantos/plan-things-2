import { useCallback, useMemo } from 'react'

const uid = () => Math.random().toString(36).slice(2, 9)

export function useBoardColumns({ activePlanId, boardColumns, updatePlanBoard }) {
  const columns = boardColumns ?? []

  const updateColumns = useCallback((updater) => {
    if (!activePlanId) return
    updatePlanBoard(activePlanId, updater)
  }, [activePlanId, updatePlanBoard])

  const createColumn = useCallback((title) => {
    const nextTitle = title.trim()

    if (!nextTitle) {
      return false
    }

    updateColumns((prev) => [
      ...prev,
      { id: uid(), title: nextTitle, color: '#a0a0a0', cards: [] },
    ])

    return true
  }, [updateColumns])

  const deleteColumn = useCallback((colId) => {
    updateColumns((prev) => prev.filter((column) => column.id !== colId))
  }, [updateColumns])

  const renameColumn = useCallback((colId, title) => {
    updateColumns((prev) => prev.map((column) => (
      column.id === colId ? { ...column, title } : column
    )))
  }, [updateColumns])

  const changeColColor = useCallback((colId, color) => {
    updateColumns((prev) => prev.map((column) => (
      column.id === colId ? { ...column, color } : column
    )))
  }, [updateColumns])

  const addCard = useCallback((colId, title) => {
    const card = {
      id: uid(),
      title,
      description: '',
      labelId: null,
      memberIds: [],
      dueDate: '',
      comments: [],
    }

    updateColumns((prev) => prev.map((column) => (
      column.id === colId ? { ...column, cards: [card, ...column.cards] } : column
    )))
  }, [updateColumns])

  const updateCard = useCallback((updatedCard) => {
    updateColumns((prev) => prev.map((column) => ({
      ...column,
      cards: column.cards.map((card) => (
        card.id === updatedCard.id ? updatedCard : card
      )),
    })))
  }, [updateColumns])

  const deleteCard = useCallback((cardId) => {
    updateColumns((prev) => prev.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    })))
  }, [updateColumns])

  const totalCards = useMemo(
    () => columns.reduce((sum, column) => sum + column.cards.length, 0),
    [columns],
  )

  return {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    addCard,
    updateCard,
    deleteCard,
  }
}
