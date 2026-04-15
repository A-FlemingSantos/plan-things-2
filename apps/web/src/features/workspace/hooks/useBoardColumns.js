import { useCallback, useMemo } from 'react'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { buildBoardCardPayload } from '../../../shared/contracts/backendAdapters.js'

const uid = () => Math.random().toString(36).slice(2, 9)

export function useBoardColumns({
  activePlanId,
  boardColumns,
  updatePlanBoard,
  isBackendDriven = false,
  accessToken = null,
  applyBoardView,
  loadPlanBoard,
}) {
  const columns = boardColumns ?? []

  const updateColumns = useCallback((updater) => {
    if (!activePlanId) return
    updatePlanBoard(activePlanId, updater)
  }, [activePlanId, updatePlanBoard])

  const createColumn = useCallback(async (title) => {
    const nextTitle = title.trim()

    if (!nextTitle || !activePlanId) {
      return false
    }

    if (!isBackendDriven) {
      updateColumns((prev) => [
        ...prev,
        { id: uid(), title: nextTitle, color: '#a0a0a0', cards: [] },
      ])
      return true
    }

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns`, {
        method: 'POST',
        token: accessToken,
        body: {
          title: nextTitle,
          color: '#a0a0a0',
        },
      })

      applyBoardView(activePlanId, boardView)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }, [accessToken, activePlanId, applyBoardView, isBackendDriven, updateColumns])

  const deleteColumn = useCallback(async (colId) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.filter((column) => column.id !== colId))
      return
    }

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      await loadPlanBoard(activePlanId)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard, updateColumns])

  const renameColumn = useCallback(async (colId, title) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => (
        column.id === colId ? { ...column, title } : column
      )))
      return
    }

    const currentColumn = columns.find((column) => column.id === colId)
    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'PATCH',
        token: accessToken,
        body: {
          title,
          color: currentColumn?.color ?? '#a0a0a0',
        },
      })

      applyBoardView(activePlanId, boardView)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, applyBoardView, columns, isBackendDriven, updateColumns])

  const changeColColor = useCallback(async (colId, color) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => (
        column.id === colId ? { ...column, color } : column
      )))
      return
    }

    const currentColumn = columns.find((column) => column.id === colId)
    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'PATCH',
        token: accessToken,
        body: {
          title: currentColumn?.title ?? 'Nova coluna',
          color,
        },
      })

      applyBoardView(activePlanId, boardView)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, applyBoardView, columns, isBackendDriven, updateColumns])

  const addCard = useCallback(async (colId, title) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
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
      return
    }

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/cards`, {
        method: 'POST',
        token: accessToken,
        body: {
          columnId: colId,
          title,
          description: '',
          labelId: null,
          assigneeIds: [],
          startAt: null,
          dueAt: null,
        },
      })

      await loadPlanBoard(activePlanId)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard, updateColumns])

  const updateCard = useCallback(async (updatedCard) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => ({
        ...column,
        cards: column.cards.map((card) => (
          card.id === updatedCard.id ? updatedCard : card
        )),
      })))
      return
    }

    const previousCard = columns.flatMap((column) => column.cards).find((card) => card.id === updatedCard.id)
    const previousCommentIds = new Set(previousCard?.comments?.map((comment) => comment.id) ?? [])
    const newComments = (updatedCard.comments ?? []).filter((comment) => !previousCommentIds.has(comment.id))

    try {
      if (newComments.length) {
        await Promise.all(newComments.map((comment) => apiRequest(
          `/api/plans/${activePlanId}/board/cards/${updatedCard.id}/comments`,
          {
            method: 'POST',
            token: accessToken,
            body: {
              message: comment.text,
            },
          },
        )))
      }

      await apiRequest(`/api/plans/${activePlanId}/board/cards/${updatedCard.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: buildBoardCardPayload(updatedCard),
      })

      await loadPlanBoard(activePlanId)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, loadPlanBoard, updateColumns])

  const deleteCard = useCallback(async (cardId) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => ({
        ...column,
        cards: column.cards.filter((card) => card.id !== cardId),
      })))
      return
    }

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      await loadPlanBoard(activePlanId)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard, updateColumns])

  const moveCard = useCallback(async (cardId, targetColumnId, targetPosition) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      return
    }

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/move`, {
        method: 'PUT',
        token: accessToken,
        body: {
          targetColumnId,
          targetPosition,
        },
      })

      applyBoardView(activePlanId, boardView)
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, activePlanId, applyBoardView, isBackendDriven])

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
    moveCard,
  }
}
