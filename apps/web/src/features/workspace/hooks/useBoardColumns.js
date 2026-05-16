import { useCallback, useMemo, useRef } from 'react'
import { ApiClientError, apiRequest } from '../../../shared/api/apiClient.js'
import { buildBoardCardPayload, mapBoardCard } from '../../../shared/contracts/backendAdapters.js'

const uid = () => Math.random().toString(36).slice(2, 9)

function mapBoardComment(comment) {
  const author = comment.author ?? null

  return {
    id: comment.id,
    author: comment.authorName,
    authorId: author?.id ?? null,
    authorName: comment.authorName,
    authorAvatarUrl: author?.avatarUrl ?? null,
    text: comment.message,
    time: comment.createdAt?.text ?? 'Agora',
  }
}

function replaceCardInColumns(columns, nextCard) {
  if (!Array.isArray(columns) || !nextCard?.id || !nextCard?.columnId) {
    return columns
  }

  const hasTargetColumn = columns.some((column) => column.id === nextCard.columnId)
  if (!hasTargetColumn) {
    return columns
  }

  return columns.map((column) => {
    const hasCard = column.cards.some((card) => card.id === nextCard.id)

    if (column.id === nextCard.columnId) {
      if (hasCard) {
        return {
          ...column,
          cards: column.cards.map((card) => (
            card.id === nextCard.id ? nextCard : card
          )),
        }
      }

      return {
        ...column,
        cards: [...column.cards, nextCard],
      }
    }

    if (!hasCard) {
      return column
    }

    return {
      ...column,
      cards: column.cards.filter((card) => card.id !== nextCard.id),
    }
  })
}

function appendCommentToCard(columns, cardId, nextComment) {
  if (!Array.isArray(columns) || !cardId || !nextComment?.id) {
    return columns
  }

  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      if (card.comments.some((comment) => comment.id === nextComment.id)) {
        return card
      }

      return {
        ...card,
        comments: [...card.comments, nextComment],
      }
    }),
  }))
}

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
  const cardMutationRef = useRef(0)

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
        { id: uid(), title: nextTitle, color: '', cards: [] },
      ])
      return true
    }

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns`, {
        method: 'POST',
        token: accessToken,
        body: {
          title: nextTitle,
          color: '',
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
          color: currentColumn?.color ?? '',
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
        isCompleted: false,
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
      const requestId = ++cardMutationRef.current
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

      if (requestId !== cardMutationRef.current) {
        return true
      }

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
      return updatedCard
    }

    const previousCard = columns.flatMap((column) => column.cards).find((card) => card.id === updatedCard.id)
    const previousCommentIds = new Set(previousCard?.comments?.map((comment) => comment.id) ?? [])
    const newComments = (updatedCard.comments ?? []).filter((comment) => !previousCommentIds.has(comment.id))
    let persistedCard = null

    try {
      const cardView = await apiRequest(`/api/plans/${activePlanId}/board/cards/${updatedCard.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: buildBoardCardPayload(updatedCard, {
          timeZone,
          dateFormat,
        }),
      })
      persistedCard = mapBoardCard(cardView, {
        timeZone,
        dateFormat,
      })

      updateColumns((prev) => replaceCardInColumns(prev, persistedCard))

      if (newComments.length) {
        const createdComments = []

        for (const comment of newComments) {
          const createdComment = await apiRequest(
            `/api/plans/${activePlanId}/board/cards/${updatedCard.id}/comments`,
            {
              method: 'POST',
              token: accessToken,
              body: {
                message: comment.text,
              },
            },
          )

          const mappedComment = mapBoardComment(createdComment)
          createdComments.push(mappedComment)
          updateColumns((prev) => appendCommentToCard(prev, updatedCard.id, mappedComment))
        }

        if (createdComments.length) {
          persistedCard = {
            ...persistedCard,
            comments: [...persistedCard.comments, ...createdComments],
          }
        }
      }

      return persistedCard
    } catch (error) {
      if (persistedCard) {
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
  }, [accessToken, activePlanId, columns, dateFormat, isBackendDriven, timeZone, updateColumns])

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

  const addCardComment = useCallback(async (cardId, message) => {
    if (!activePlanId || !isBackendDriven) return null

    const createdComment = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/comments`, {
      method: 'POST',
      token: accessToken,
      body: {
        message,
      },
    })

    const mappedComment = mapBoardComment(createdComment)
    updateColumns((prev) => appendCommentToCard(prev, cardId, mappedComment))
    return mappedComment
  }, [accessToken, activePlanId, isBackendDriven, updateColumns])

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

  const createChecklist = useCallback(async (cardId, title) => {
    if (!activePlanId || !isBackendDriven) return null

    const checklist = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/checklists`, {
      method: 'POST',
      token: accessToken,
      body: {
        title,
      },
    })

    await loadPlanBoard(activePlanId)
    return checklist
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard])

  const deleteChecklist = useCallback(async (checklistId) => {
    if (!activePlanId || !isBackendDriven) return false

    await apiRequest(`/api/plans/${activePlanId}/board/checklists/${checklistId}`, {
      method: 'DELETE',
      token: accessToken,
    })

    await loadPlanBoard(activePlanId)
    return true
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard])

  const createChecklistItem = useCallback(async (checklistId, item) => {
    if (!activePlanId || !isBackendDriven) return null

    const createdItem = await apiRequest(`/api/plans/${activePlanId}/board/checklists/${checklistId}/items`, {
      method: 'POST',
      token: accessToken,
      body: {
        title: item.title ?? item.text ?? '',
        assigneeUserId: item.assigneeUserId ?? null,
        startAt: item.startAt ?? null,
        dueAt: item.dueAt ?? null,
      },
    })

    await loadPlanBoard(activePlanId)
    return createdItem
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard])

  const updateChecklistItem = useCallback(async (item) => {
    if (!activePlanId || !isBackendDriven) return null

    const updatedItem = await apiRequest(`/api/plans/${activePlanId}/board/checklists/items/${item.id}`, {
      method: 'PATCH',
      token: accessToken,
      body: {
        title: item.title ?? item.text ?? '',
        completed: Boolean(item.completed ?? item.checked),
        assigneeUserId: item.assigneeUserId ?? null,
        startAt: item.startAt ?? null,
        dueAt: item.dueAt ?? null,
      },
    })

    await loadPlanBoard(activePlanId)
    return updatedItem
  }, [accessToken, activePlanId, isBackendDriven, loadPlanBoard])

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
    addCardComment,
    moveCard,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
  }
}
