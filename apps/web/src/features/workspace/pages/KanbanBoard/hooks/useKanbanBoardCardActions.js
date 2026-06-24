import { useCallback, useMemo } from 'react'
import { moveCardInColumns } from '../../../hooks/boardDnDUtils.js'
import {
  areCardsEquivalentForPersistence,
  findCardInColumns,
  replaceCardInColumns,
} from '../utils/kanbanBoardColumnUtils.js'

export function useKanbanBoardCardActions({
  columns,
  updateColumns,
  updateCard,
  deleteCard,
  moveCard,
  isBackendDriven,
  activePlanId,
  activeCard,
  setActiveCard,
  showNotification,
}) {
  const saveCardOptimistically = useCallback(async (nextCard) => {
    if (!nextCard?.id) {
      return updateCard(nextCard)
    }

    const previousColumns = columns
    const previousCard = findCardInColumns(previousColumns, nextCard.id)

    updateColumns((currentColumns) => replaceCardInColumns(currentColumns, nextCard))
    setActiveCard((current) => (
      current?.card?.id === nextCard.id
        ? { ...current, card: nextCard }
        : current
    ))

    try {
      const persistedCard = await updateCard(nextCard)
      if (persistedCard) {
        const shouldReplaceActiveCard = !areCardsEquivalentForPersistence(persistedCard, nextCard)
        if (shouldReplaceActiveCard) {
          setActiveCard((current) => (
            current?.card?.id === persistedCard.id
              ? { ...current, card: persistedCard }
              : current
          ))
        }
      }
      return persistedCard ?? nextCard
    } catch (error) {
      updateColumns(() => previousColumns)
      setActiveCard((current) => {
        if (current?.card?.id !== nextCard.id) {
          return current
        }

        return previousCard
          ? { ...current, card: previousCard }
          : current
      })
      throw error
    }
  }, [columns, updateCard, updateColumns, setActiveCard])

  const handleCardUpdate = async (updatedCard) => saveCardOptimistically(updatedCard)

  const handleCardDelete = async (cardId) => {
    const previousActiveCard = activeCard
    setActiveCard(null)

    try {
      await deleteCard(cardId)
    } catch (error) {
      setActiveCard(previousActiveCard ?? null)
      showNotification(error?.message ?? 'Não foi possível excluir o cartão.')
      throw error
    }
  }

  const handleBoardCardClick = useCallback((card, colTitle) => {
    setActiveCard({ card, colTitle })
  }, [setActiveCard])

  const canMoveActiveCardToNextColumn = useMemo(() => {
    if (!activeCard?.card?.id || !columns.length) return false

    const sourceColumnIndex = columns.findIndex((column) => (
      column.cards.some((card) => card.id === activeCard.card.id)
    ))

    return sourceColumnIndex >= 0 && sourceColumnIndex < columns.length - 1
  }, [activeCard, columns])

  const handleMoveCardToNextColumn = useCallback(async () => {
    const cardId = activeCard?.card?.id
    if (!cardId || !activePlanId) return

    const sourceColumnIndex = columns.findIndex((column) => (
      column.cards.some((card) => card.id === cardId)
    ))
    if (sourceColumnIndex === -1 || sourceColumnIndex >= columns.length - 1) return

    const sourceColumn = columns[sourceColumnIndex]
    const nextColumn = columns[sourceColumnIndex + 1]
    const target = { type: 'col', colId: nextColumn.id }
    const targetPosition = nextColumn.cards.length
    const previousColumns = columns
    const previousActiveCard = activeCard

    updateColumns((prev) => moveCardInColumns(prev, cardId, sourceColumn.id, target))
    setActiveCard((current) => (
      current?.card?.id === cardId
        ? {
          ...current,
          colTitle: nextColumn.title,
          card: { ...current.card, columnId: nextColumn.id },
        }
        : current
    ))

    if (!isBackendDriven) {
      return
    }

    try {
      await moveCard(cardId, nextColumn.id, targetPosition)
    } catch (error) {
      updateColumns(() => previousColumns)
      setActiveCard(previousActiveCard ?? null)
      showNotification(error?.message ?? 'Não foi possível mover o cartão.')
      throw error
    }
  }, [activeCard, activePlanId, columns, isBackendDriven, moveCard, setActiveCard, showNotification, updateColumns])

  const togglePlannerCardCompleted = useCallback(async (card) => {
    try {
      await saveCardOptimistically({
        ...card,
        isCompleted: !card.isCompleted,
      })
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível atualizar a tarefa.')
    }
  }, [saveCardOptimistically, showNotification])

  return {
    saveCardOptimistically,
    handleCardUpdate,
    handleCardDelete,
    handleBoardCardClick,
    canMoveActiveCardToNextColumn,
    handleMoveCardToNextColumn,
    togglePlannerCardCompleted,
  }
}
