import { useCallback, useMemo } from 'react'
import { ApiClientError, apiRequest } from '../../../shared/api/apiClient.js'
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
  timeZone = 'America/Sao_Paulo',
  dateFormat = 'dd/MM/yyyy',
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
      throw error
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
      return true
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
      return true
    } catch (error) {
      throw error
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
      return true
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
      return true
    } catch (error) {
      throw error
    }
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard, updateColumns])

  const updateCard = useCallback(async (updatedCard) => {
    if (!activePlanId) return false

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => ({
        ...column,
        cards: column.cards.map((card) => (
          card.id === updatedCard.id ? updatedCard : card
        )),
      })))
      return true
    }

    const previousCard = columns.flatMap((column) => column.cards).find((card) => card.id === updatedCard.id)
    const previousCommentIds = new Set(previousCard?.comments?.map((comment) => comment.id) ?? [])
    const newComments = (updatedCard.comments ?? []).filter((comment) => !previousCommentIds.has(comment.id))
    let cardUpdated = false

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/cards/${updatedCard.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: buildBoardCardPayload(updatedCard, {
          timeZone,
          dateFormat,
        }),
      })
      cardUpdated = true

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

      await loadPlanBoard(activePlanId)
      return true
    } catch (error) {
      if (cardUpdated) {
        await loadPlanBoard(activePlanId).catch(() => {})
        throw new ApiClientError(
          'Os dados do cartão foram salvos, mas não foi possível concluir o envio dos comentários.',
          {
            code: 'ATUALIZACAO_PARCIAL_CARTAO',
            status: error?.status ?? 500,
          },
        )
      }

      throw error
    }
  }, [accessToken, activePlanId, columns, dateFormat, isBackendDriven, loadPlanBoard, timeZone, updateColumns])

  const deleteCard = useCallback(async (cardId) => {
    if (!activePlanId) return false

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => ({
        ...column,
        cards: column.cards.filter((card) => card.id !== cardId),
      })))
      return true
    }

    await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}`, {
      method: 'DELETE',
      token: accessToken,
    })
    await loadPlanBoard(activePlanId)
    return true
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard, updateColumns])

  const moveCard = useCallback(async (cardId, targetColumnId, targetPosition) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      return
    }

    const boardView = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/move`, {
      method: 'PUT',
      token: accessToken,
      body: {
        targetColumnId,
        targetPosition,
      },
    })

    applyBoardView(activePlanId, boardView)
    return true
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
